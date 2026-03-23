import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const TEST_EMAIL = 'admin@wraptors.dev'
const TEST_PASSWORD = 'Wraptors2024!'
const TEST_NAME = 'Test CEO'
const TEST_ROLE = 'ceo'

async function run() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\nCreating test user...\n')

  const { data: existingUsersData } = await supabase.auth.admin.listUsers()
  const existing = existingUsersData?.users?.find((u) => u.email === TEST_EMAIL)

  let userId: string

  if (existing) {
    console.log('Auth user already exists, reusing')
    userId = existing.id
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error || !data.user) {
      console.error('Failed to create auth user:', error?.message ?? 'Unknown error')
      process.exit(1)
    }
    userId = data.user.id
    console.log('Auth user created, ID:', userId)
  }

  const { error: profileError } = await supabase.from('staff_users').upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      full_name: TEST_NAME,
      role: TEST_ROLE,
      is_active: true,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('Failed to insert staff_users row:', profileError.message)
    console.log('\nRun this manually in Supabase SQL Editor:')
    console.log(`
INSERT INTO staff_users (id, email, full_name, role, is_active)
VALUES ('${userId}', '${TEST_EMAIL}', '${TEST_NAME}', '${TEST_ROLE}', true)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;
    `)
    process.exit(1)
  }

  console.log('staff_users record ready\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  TEST LOGIN CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  URL:      http://localhost:3000/login')
  console.log(`  Email:    ${TEST_EMAIL}`)
  console.log(`  Password: ${TEST_PASSWORD}`)
  console.log('  Role:     CEO (full access)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
