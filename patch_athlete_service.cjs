const fs = require('fs');

let content = fs.readFileSync('src/services/athleteService.ts', 'utf-8');

// 1. Add withTimeout helper if not present
if (!content.includes('function withTimeout')) {
  const withTimeoutHelper = `
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}
`;
  content = content.replace('export function calculateCareerStats(', withTimeoutHelper + '\nexport function calculateCareerStats(');
}

// 2. Profile query columns
const profileSelectOld = /\.select\('\*'\)/g;
const profileSelectNew = ".select('id, auth_user_id, full_name, nickname, nickname_normalized, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url, created_at, updated_at')";

// Replace the profiles select queries inside getAthleteDashboardData
content = content.replace(
  /const \{ data \} = await supabase\s*\.from\('profiles'\)\s*\.select\('\*'\)\s*\.eq\('id', profileIdHint\)\s*\.maybeSingle\(\);/g,
  `const { data } = await withTimeout(
          supabase.from('profiles').select('id, auth_user_id, full_name, nickname, nickname_normalized, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url, created_at, updated_at').eq('id', profileIdHint).maybeSingle(),
          2000,
          { data: null } as any
        );`
);

content = content.replace(
  /const \{ data \} = await supabase\s*\.from\('profiles'\)\s*\.select\('\*'\)\s*\.or\(`auth_user_id\.eq\.\$\{authUserId\},id\.eq\.\$\{authUserId\}`\)\s*\.maybeSingle\(\);/g,
  `const { data } = await withTimeout(
          supabase.from('profiles').select('id, auth_user_id, full_name, nickname, nickname_normalized, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url, created_at, updated_at').or(\`auth_user_id.eq.\${authUserId},id.eq.\${authUserId}\`).maybeSingle(),
          2000,
          { data: null } as any
        );`
);

content = content.replace(
  /const \{ data \} = await supabase\s*\.from\('profiles'\)\s*\.select\('\*'\)\s*\.or\(`nickname_normalized\.eq\.\$\{cleanNick\},nickname\.ilike\.\$\{nickToSearch\.trim\(\)\}`\)\s*\.maybeSingle\(\);/g,
  `const { data } = await withTimeout(
          supabase.from('profiles').select('id, auth_user_id, full_name, nickname, nickname_normalized, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url, created_at, updated_at').or(\`nickname_normalized.eq.\${cleanNick},nickname.ilike.\${nickToSearch.trim()}\`).maybeSingle(),
          2000,
          { data: null } as any
        );`
);

// 3. Registrations and event fetch with withTimeout
const regPromiseOld = /const \[regRes, evtRes, catRes\] = await Promise\.all\(\[\s*supabase\.from\('event_registrations'\)\.select\('\*'\)\.or\(regFilter\),\s*supabase\.from\('events'\)\.select\('\*'\),\s*supabase\.from\('weight_categories'\)\.select\('\*'\),\s*\]\);/;
const regPromiseNew = `const [regRes, evtRes, catRes] = await withTimeout(
          Promise.all([
            supabase.from('event_registrations').select('*').or(regFilter),
            supabase.from('events').select('*'),
            supabase.from('weight_categories').select('*'),
          ]),
          2500,
          [{ data: null }, { data: null }, { data: null }] as any
        );`;
content = content.replace(regPromiseOld, regPromiseNew);

// 4. Matches and announcements fetch with withTimeout
const matchesPromiseOld = /const \[rawMatchesRes, announcementsRes, mediaRes\] = await Promise\.all\(\[\s*supabase\s*\.from\('matches'\)[\s\S]*?supabase\s*\.from\('media_items'\)\s*\.select\('\*'\)\s*\.eq\('event_id', currentReg\.event_id\),\s*\]\);/;
const matchesPromiseNew = `const [rawMatchesRes, announcementsRes, mediaRes] = await withTimeout(
            Promise.all([
              supabase.from('matches').select('*').eq('event_id', currentReg.event_id),
              supabase.from('event_announcements').select('*').eq('event_id', currentReg.event_id).order('created_at', { ascending: false }),
              supabase.from('media_items').select('*').eq('event_id', currentReg.event_id),
            ]),
            2500,
            [{ data: null }, { data: null }, { data: null }] as any
          );`;
content = content.replace(matchesPromiseOld, matchesPromiseNew);

// 5. Fighter profiles lookup with withTimeout
const fighterProfOld = /const \{ data: fighterProfiles \} = await supabase\s*\.from\('profiles'\)\s*\.select\('id, full_name, nickname, auth_user_id'\)\s*\.limit\(100\);/;
const fighterProfNew = `const { data: fighterProfiles } = await withTimeout(
              supabase.from('profiles').select('id, full_name, nickname, auth_user_id').limit(100),
              1500,
              { data: null } as any
            );`;
content = content.replace(fighterProfOld, fighterProfNew);

fs.writeFileSync('src/services/athleteService.ts', content, 'utf-8');
console.log('athleteService.ts successfully patched.');

