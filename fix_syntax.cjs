const fs = require('fs');
let c = fs.readFileSync('src/services/adminService.ts', 'utf-8');
const badPart = `    saveUnifiedStore(unified, { silent: true });
  } catch (err) {
    console.error('[AdminService] Falha ao sincronizar para o UnifiedStore:', err);
  }
} catch (err) {
    console.error('[AdminService] Falha ao sincronizar para o UnifiedStore:', err);
  }
}`;
const goodPart = `    saveUnifiedStore(unified, { silent: true });
  } catch (err) {
    console.error('[AdminService] Falha ao sincronizar para o UnifiedStore:', err);
  }
}`;

c = c.replace(/\r\n/g, '\n');
c = c.replace(badPart, goodPart);
fs.writeFileSync('src/services/adminService.ts', c, 'utf-8');
console.log('Fixed syntax in adminService.ts');

