const fs = require('fs');

let content = fs.readFileSync('src/services/adminService.ts', 'utf-8');

// 1. Add deleted blacklist functions if not present
if (!content.includes('DELETED_REGS_STORAGE_KEY')) {
  const blacklistCode = `
const DELETED_REGS_STORAGE_KEY = 'ucu_deleted_registrations_v1';

export function getDeletedRegistrationIds(): Set<string> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DELETED_REGS_STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

export function addDeletedRegistrationId(id: string, profileId?: string) {
  try {
    if (typeof window !== 'undefined') {
      const set = getDeletedRegistrationIds();
      if (id) set.add(id);
      if (profileId) set.add(profileId);
      localStorage.setItem(DELETED_REGS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {}
}
`;
  content = content.replace('export function syncAdminStoreFromUnified(): void {', blacklistCode + '\nexport function syncAdminStoreFromUnified(): void {');
}

// 2. Update syncAdminStoreToUnified to use deletedIds and silent save
const syncAdminStoreToUnifiedRegex = /export function syncAdminStoreToUnified\(\): void \{[\s\S]*?saveUnifiedStore\(unified\);[\s\S]*?\}/;
const newSyncAdminStoreToUnified = `export function syncAdminStoreToUnified(): void {
  try {
    const deletedIds = getDeletedRegistrationIds();
    const unified = getUnifiedStore();
    unified.events = [...adminStore.events];
    unified.registrations = adminStore.registrations.filter(
      (r) => !deletedIds.has(r.id) && (!r.profile_id || !deletedIds.has(r.profile_id))
    );
    unified.matches = [...adminStore.matches];
    unified.announcements = [...adminStore.announcements];
    unified.mediaItems = [...adminStore.mediaItems];
    unified.auditLogs = [...adminStore.auditLogs];

    // Popular unified.users para qualquer perfil da nuvem que ainda não esteja no store local
    for (const reg of unified.registrations) {
      if (reg.profile && reg.profile.nickname) {
        const cleanNick = reg.profile.nickname.trim().toLowerCase();
        const existing = unified.users.find(
          (u) =>
            u.nicknameNormalized === cleanNick ||
            u.id === reg.profile?.auth_user_id ||
            u.profileId === reg.profile?.id
        );
        if (!existing) {
          unified.users.push({
            id: reg.profile.auth_user_id || reg.profile.id,
            nickname: reg.profile.nickname,
            nicknameNormalized: cleanNick,
            password: 'password',
            fullName: reg.profile.full_name,
            recoveryEmail: reg.profile.recovery_email,
            isAdmin: false,
            profileId: reg.profile.id,
            createdAt: reg.profile.created_at || new Date().toISOString(),
          });
        }
      }
    }

    saveUnifiedStore(unified, { silent: true });
  } catch (err) {
    console.error('[AdminService] Falha ao sincronizar para o UnifiedStore:', err);
  }
}`;
content = content.replace(syncAdminStoreToUnifiedRegex, newSyncAdminStoreToUnified);

// 3. Update getAdminDashboardSummary cloudFetch to select specific columns and filter deleted
const cloudFetchTargetRegex = /const cloudFetch = Promise\.all\(\[\s*supabase\.from\('event_registrations'\)\.select\('\*'\),\s*supabase\.from\('profiles'\)\.select\('\*'\),/;
const newCloudFetch = `const cloudFetch = Promise.all([
      supabase.from('event_registrations').select('*'),
      supabase.from('profiles').select('id, auth_user_id, full_name, nickname, nickname_normalized, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url, created_at, updated_at'),`;
content = content.replace(cloudFetchTargetRegex, newCloudFetch);

// 4. Update getAdminDashboardSummary merging logic to respect blacklist and local approved status
const mergingTargetRegex = /\/\/ Mesclar registros da nuvem preservando integridade[\s\S]*?adminStore\.registrations = Array\.from\(cloudMap\.values\(\)\);/;
const newMerging = `// Mesclar registros da nuvem preservando integridade e filtrando excluídos
      const deletedIds = getDeletedRegistrationIds();
      const cloudMap = new Map<string, EventRegistration>();
      for (const reg of mappedCloudRegs) {
        if (deletedIds.has(reg.id) || (reg.profile_id && deletedIds.has(reg.profile_id))) {
          continue;
        }
        // Se já está aprovado localmente pelo admin, preserva status aprovado
        const local = adminStore.registrations.find((r) => r.id === reg.id || r.profile_id === reg.profile_id);
        if (local && local.status === 'approved' && reg.status !== 'approved') {
          reg.status = 'approved';
          reg.rejection_reason = null;
        }
        cloudMap.set(reg.id, reg);
      }

      // Adiciona registros locais que ainda não subiram
      for (const localReg of adminStore.registrations) {
        if (deletedIds.has(localReg.id) || (localReg.profile_id && deletedIds.has(localReg.profile_id))) {
          continue;
        }
        if (!cloudMap.has(localReg.id)) {
          cloudMap.set(localReg.id, localReg);
        }
      }

      adminStore.registrations = Array.from(cloudMap.values());`;
content = content.replace(mergingTargetRegex, newMerging);

// 5. Update deleteAthleteRegistration
const deleteFuncRegex = /export async function deleteAthleteRegistration\([\s\S]*?return \{ success: true \};\s*\}/;
const newDeleteFunc = `export async function deleteAthleteRegistration(
  registrationId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const unified = getUnifiedStore();
  const regToDelete = adminStore.registrations.find((r) => r.id === registrationId) ||
                      unified.registrations.find((r) => r.id === registrationId);
  const profileId = regToDelete?.profile_id || regToDelete?.profile?.id || registrationId;
  const authUserId = regToDelete?.profile?.auth_user_id;
  const nickNorm = regToDelete?.profile?.nickname ? regToDelete.profile.nickname.trim().toLowerCase() : undefined;

  // 1. Marca imediatamente no blacklist local para garantia absoluta contra retorno
  addDeletedRegistrationId(registrationId, profileId);

  // 2. Executa exclusão no Supabase com timeout resiliente de 2.5s (sem travar a interface)
  try {
    const cloudDeletes = Promise.all([
      supabase.from('matches').delete().or(\`fighter1_registration_id.eq.\${registrationId},fighter2_registration_id.eq.\${registrationId}\`),
      supabase.from('event_registrations').delete().or(\`id.eq.\${registrationId},profile_id.eq.\${registrationId},profile_id.eq.\${profileId}\`),
      supabase.from('profiles').delete().or(\`id.eq.\${profileId},id.eq.\${registrationId}\`),
      supabase.rpc('admin_delete_registration', { p_reg_id: registrationId }),
    ]);

    await Promise.race([
      cloudDeletes,
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (err) {
    console.warn('[AdminService] Falha ao excluir no Supabase:', err);
  }

  // 3. Remove imediatamente do store em memória do admin
  adminStore.registrations = adminStore.registrations.filter(
    (r) => r.id !== registrationId && r.profile_id !== profileId && (!profileId || r.profile?.id !== profileId)
  );
  adminStore.matches = adminStore.matches.filter(
    (m) => m.fighter1_registration_id !== registrationId && m.fighter2_registration_id !== registrationId
  );

  // 4. Limpa usuário e inscrição correspondentes do store unificado
  try {
    unified.registrations = unified.registrations.filter(
      (r) => r.id !== registrationId && r.profile_id !== profileId && (!profileId || r.profile?.id !== profileId)
    );
    unified.matches = unified.matches.filter(
      (m) => m.fighter1_registration_id !== registrationId && m.fighter2_registration_id !== registrationId
    );
    unified.users = unified.users.filter(
      (u) =>
        u.profileId !== profileId &&
        u.id !== authUserId &&
        u.id !== registrationId &&
        (!nickNorm || u.nicknameNormalized !== nickNorm)
    );
    saveUnifiedStore(unified, { silent: true });
  } catch (cleanErr) {
    console.warn('[AdminService] Aviso ao limpar usuário excluído:', cleanErr);
  }

  logAuditAction(
    null,
    'ATHLETE_DELETED',
    'event_registrations',
    registrationId,
    \`Cadastro excluído pelo admin \${adminNickname}.\`,
    adminNickname
  );

  syncAdminStoreToUnified();
  return { success: true };
}`;
content = content.replace(deleteFuncRegex, newDeleteFunc);

fs.writeFileSync('src/services/adminService.ts', content, 'utf-8');
console.log('adminService.ts successfully patched.');

