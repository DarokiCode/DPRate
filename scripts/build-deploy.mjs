// Builds the folder to upload to the live server (InfinityFree or any PHP + MySQL host).
// Run from the project root, after "npm run build" in frontend/:
//   node scripts/build-deploy.mjs
// Result: deploy/htdocs  (upload its CONTENTS into the host's htdocs folder)
//         deploy/dprate_hosting.sql  (import it in the host's phpMyAdmin)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const out = join(root, 'deploy')
const htdocs = join(out, 'htdocs')
const dist = join(root, 'frontend', 'dist')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('frontend/dist is missing. Run "npm run build" inside frontend first.')
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(htdocs, { recursive: true })

// 1. The React build: index.html, JavaScript, CSS, fonts and images.
cpSync(dist, htdocs, { recursive: true })

// 2. The PHP API, with its require pointing at the protected includes folder.
cpSync(join(root, 'backend', 'public', 'api'), join(htdocs, 'api'), { recursive: true })
for (const file of readdirSync(join(htdocs, 'api'))) {
  const path = join(htdocs, 'api', file)
  writeFileSync(path, readFileSync(path, 'utf8').replace("/../../includes/bootstrap.php'", "/../includes/bootstrap.php'"))
}

// 3. The PHP includes (config, database, rules). Never served to visitors.
cpSync(join(root, 'backend', 'includes'), join(htdocs, 'includes'), {
  recursive: true,
  filter: source => !source.endsWith('config.local.php'), // real passwords stay on each computer
})
writeFileSync(join(htdocs, 'includes', '.htaccess'), [
  '# Nobody may open these files in a browser. PHP still includes them.',
  '<IfModule mod_authz_core.c>', '  Require all denied', '</IfModule>',
  '<IfModule !mod_authz_core.c>', '  Order allow,deny', '  Deny from all', '</IfModule>', '',
].join('\n'))

// 4. Site settings: no folder listings, safer headers, index.html as the home page.
//    index.html must be checked again on every visit, so a new version shows at once (the host
//    caches pages for 30 days by default). Files in assets/ get a new name on every build,
//    so they can stay cached.
writeFileSync(join(htdocs, '.htaccess'), [
  'Options -Indexes',
  'DirectoryIndex index.html',
  '<IfModule mod_expires.c>',
  '  ExpiresActive On',
  '  ExpiresByType text/html "access plus 0 seconds"',
  '</IfModule>',
  '<IfModule mod_headers.c>',
  '  Header set X-Content-Type-Options "nosniff"',
  '  Header set Referrer-Policy "strict-origin-when-cross-origin"',
  '  Header set X-Frame-Options "SAMEORIGIN"',
  '  <FilesMatch "\\.html$">',
  '    Header set Cache-Control "no-cache"',
  '  </FilesMatch>',
  '</IfModule>', '',
].join('\n'))

// 5. The database for phpMyAdmin on the host. The host creates the database in its panel,
//    so CREATE DATABASE and USE are removed.
const sql = readFileSync(join(root, 'backend', 'database', 'dprate.sql'), 'utf8')
  .replace(/^CREATE DATABASE[^\n]*\n/m, '')
  .replace(/^USE dprate;\n/m, '')
writeFileSync(join(out, 'dprate_hosting.sql'), '-- Hosting version: select your database in phpMyAdmin first, then import this file.\n' + sql)

console.log('Ready: deploy/htdocs and deploy/dprate_hosting.sql')
console.log('Next: create htdocs/includes/config.local.php on the server with the database details.')
