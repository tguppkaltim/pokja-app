// Edge Function: kelola-pengguna
//
// Membuat akun, menonaktifkan/mengaktifkan, dan mereset password — semuanya
// butuh service_role, yang tidak boleh ada di frontend karena siapa pun bisa
// membacanya dari bundle.
//
// SUPABASE_SERVICE_ROLE_KEY tersedia otomatis di lingkungan Edge Function;
// tidak perlu ditempel sebagai secret.
//
// Deploy: Dashboard Supabase > Edge Functions > Deploy new function,
// atau `supabase functions deploy kelola-pengguna`.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const URL_SUPABASE = Deno.env.get('SUPABASE_URL')!
const KUNCI_ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const KUNCI_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Ban 100 tahun. Supabase tidak punya "ban selamanya", jadi dipakai durasi yang
// melampaui umur pakai sistem.
const DURASI_BAN = '876000h'

function jawab(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return jawab({ error: 'Metode tidak didukung.' }, 405)

  const admin = createClient(URL_SUPABASE, KUNCI_SERVICE)

  try {
    // ── Siapa pemanggilnya ───────────────────────────────────────────────────
    const authorization = req.headers.get('Authorization') ?? ''
    if (!authorization) return jawab({ error: 'Tidak ada sesi.' }, 401)

    const sebagaiPemanggil = createClient(URL_SUPABASE, KUNCI_ANON, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: dataUser, error: errUser } = await sebagaiPemanggil.auth.getUser()
    if (errUser || !dataUser?.user) return jawab({ error: 'Sesi tidak sah.' }, 401)

    // Peran dibaca dari database memakai service_role, BUKAN dari klaim JWT
    // atau dari body permintaan. Kalau tidak, pembatasan "khusus super admin"
    // hanya sekuat tebakan frontend.
    const { data: profil, error: errProfil } = await admin
      .from('profiles')
      .select('role')
      .eq('id', dataUser.user.id)
      .single()
    if (errProfil || profil?.role !== 'super_admin') {
      return jawab({ error: 'Hanya super admin yang boleh mengelola akun.' }, 403)
    }

    // ── Jalankan aksinya ─────────────────────────────────────────────────────
    const body = await req.json()
    const aksi = body?.aksi

    if (aksi === 'buat') {
      const { email, password, full_name, role, pokja_id } = body
      if (!email || !password || !full_name || !role) {
        return jawab({ error: 'Nama, email, password, dan role wajib diisi.' }, 400)
      }
      if (String(password).length < 8) {
        return jawab({ error: 'Password minimal 8 karakter.' }, 400)
      }
      if (role === 'operator' && !pokja_id) {
        return jawab({ error: 'Operator wajib punya pokja.' }, 400)
      }

      const { data: dibuat, error: errBuat } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // tanpa ini pengguna tidak bisa login sampai mengonfirmasi email
        user_metadata: { full_name },
      })
      if (errBuat) return jawab({ error: errBuat.message }, 400)

      // Trigger handle_new_user sudah membuat baris profiles dengan role
      // 'viewer'; di sini disesuaikan ke role dan pokja yang dipilih.
      const { error: errProfilBaru } = await admin
        .from('profiles')
        .update({
          full_name,
          role,
          pokja_id: role === 'operator' ? pokja_id : null,
          is_active: true,
        })
        .eq('id', dibuat.user.id)
      if (errProfilBaru) return jawab({ error: errProfilBaru.message }, 400)

      return jawab({ ok: true, user_id: dibuat.user.id })
    }

    if (aksi === 'nonaktifkan' || aksi === 'aktifkan') {
      const { user_id } = body
      if (!user_id) return jawab({ error: 'user_id wajib diisi.' }, 400)
      if (user_id === dataUser.user.id) {
        return jawab({ error: 'Tidak bisa menonaktifkan akun sendiri.' }, 400)
      }

      const nonaktif = aksi === 'nonaktifkan'
      const { error: errBan } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: nonaktif ? DURASI_BAN : 'none',
      })
      if (errBan) return jawab({ error: errBan.message }, 400)

      // Mencabut refresh token supaya sesi yang sedang berjalan tidak bisa
      // diperpanjang. Access token yang sudah dipegang tetap sah sampai
      // kedaluwarsa — itulah sebabnya AuthContext juga memeriksa is_active.
      if (nonaktif) await admin.auth.admin.signOut(user_id)

      const { error: errFlag } = await admin
        .from('profiles')
        .update({ is_active: !nonaktif })
        .eq('id', user_id)
      if (errFlag) return jawab({ error: errFlag.message }, 400)

      return jawab({ ok: true })
    }

    if (aksi === 'reset_password') {
      const { user_id, password } = body
      if (!user_id || !password) return jawab({ error: 'user_id dan password wajib diisi.' }, 400)
      if (String(password).length < 8) {
        return jawab({ error: 'Password minimal 8 karakter.' }, 400)
      }

      const { error } = await admin.auth.admin.updateUserById(user_id, { password })
      if (error) return jawab({ error: error.message }, 400)
      return jawab({ ok: true })
    }

    return jawab({ error: `Aksi tidak dikenal: ${aksi}` }, 400)
  } catch (e) {
    return jawab({ error: e instanceof Error ? e.message : 'Kesalahan tak terduga.' }, 500)
  }
})
