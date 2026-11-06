# SQL Query Builder

Pembuatan query SQL secara visual dari schema contoh atau impor JSON. Aplikasi tidak mengeksekusi query atau menghubungkan database produksi.

## Fitur

- Tabel/kolom SELECT, JOIN INNER/LEFT/RIGHT, kondisi WHERE termasuk IN dan NULL.
- ORDER BY, arah ASC/DESC, dan LIMIT tervalidasi.
- Import schema JSON, termasuk desain dari Database Designer.
- Preview, salin, export SQL dan JSON berisi SQL/bindings.
- Nilai dipisahkan menjadi positional bindings; gunakan keduanya dalam prepared statement.

## Teknologi

Laravel 13, React 19, Inertia.js 2, TypeScript, Vite, Vitest, PHPUnit.

## Cara menjalankan

Memerlukan PHP 8.3+, Composer, dan Node.js 22.12+. Arahkan document root Laragon ke folder `public`.

```sh
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm ci
npm run build
php artisan serve
```

Buka http://127.0.0.1:8000. Jalankan `php artisan test` dan `npm test` untuk pengujian.
