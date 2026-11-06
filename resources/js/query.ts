export interface Schema { tables: { name: string; columns: { name: string; type: string }[] }[] }
export interface Join { table: string; kind: 'INNER' | 'LEFT' | 'RIGHT'; left: string; right: string }
export interface Condition { column: string; op: string; value: string; glue: 'AND' | 'OR' }
export interface Query { base: string; columns: string[]; joins: Join[]; where: Condition[]; order: string; direction: 'ASC' | 'DESC'; limit: number }
export const operators = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];
export const sample: Schema = { tables: [{ name: 'users', columns: [{ name: 'id', type: 'BIGINT' }, { name: 'name', type: 'VARCHAR(255)' }, { name: 'email', type: 'VARCHAR(255)' }] }, { name: 'posts', columns: [{ name: 'id', type: 'BIGINT' }, { name: 'user_id', type: 'BIGINT' }, { name: 'title', type: 'VARCHAR(255)' }, { name: 'published', type: 'BOOLEAN' }] }] };
export const initial = (base: string): Query => ({ base, columns: [], joins: [], where: [], order: '', direction: 'ASC', limit: 100 });
const identifier = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
export function parseSchema(text: string): Schema {
  const d = JSON.parse(text); if (!d || !Array.isArray(d.tables) || !d.tables.length || d.tables.length > 200) throw new Error('Schema memerlukan 1–200 tabel dalam object tables.');
  const names = new Set<string>();
  const tables = d.tables.map((t: Schema['tables'][number]) => { if (!t || typeof t.name !== 'string' || !identifier.test(t.name) || names.has(t.name.toLowerCase()) || !Array.isArray(t.columns) || !t.columns.length || t.columns.length > 200) throw new Error('Nama tabel harus unik dan memiliki kolom.'); names.add(t.name.toLowerCase()); const cols = new Set<string>();
    return { name: t.name, columns: t.columns.map(c => { if (!c || !identifier.test(c.name) || cols.has(c.name.toLowerCase()) || typeof c.type !== 'string' || !/^[A-Z]+(?:\([0-9,]+\))?$/i.test(c.type) || c.type.length > 40) throw new Error('Kolom schema tidak valid atau duplikat.'); cols.add(c.name.toLowerCase()); return { name: c.name, type: c.type.toUpperCase() }; }) };
  }); return { tables };
}
const q = (name: string) => '`' + name + '`';
export const available = (s: Schema, query: Query) => s.tables.filter(t => [query.base, ...query.joins.map(j => j.table)].includes(t.name)).flatMap(t => t.columns.map(c => t.name + '.' + c.name));
export function build(s: Schema, query: Query) {
  parseSchema(JSON.stringify(s));
  if (!s.tables.some(t => t.name === query.base)) throw new Error('Pilih tabel sumber yang valid.');
  const joined = new Set([query.base]); const params: (string | number | boolean)[] = [];
  const column = (name: string, allowed = joined): string => { const [table, col, extra] = name.split('.'); if (extra || !allowed.has(table) || !s.tables.find(t => t.name === table)?.columns.some(c => c.name === col)) throw new Error('Kolom di luar tabel query: ' + name); return q(table) + '.' + q(col); };
  let from = 'FROM ' + q(query.base);
  for (const join of query.joins) { if (!['INNER','LEFT','RIGHT'].includes(join.kind) || joined.has(join.table) || !s.tables.some(t => t.name === join.table) || !join.left.startsWith([...joined].find(t => join.left.startsWith(t + '.')) + '.')) throw new Error('JOIN memerlukan tabel baru dan kolom dari tabel sebelumnya.'); const left = column(join.left); joined.add(join.table); if (!join.right.startsWith(join.table + '.')) throw new Error('Kolom kanan JOIN harus berasal dari tabel baru.'); from += '\n' + join.kind + ' JOIN ' + q(join.table) + ' ON ' + left + ' = ' + column(join.right); }
  const selected = query.columns.length ? query.columns.map(c => column(c)).join(', ') : q(query.base) + '.*';
  let out = 'SELECT ' + selected + '\n' + from;
  const bind = (value: string | number | boolean) => { params.push(value); return '?'; };
  for (let i = 0; i < query.where.length; i++) { const w = query.where[i]; if (!operators.includes(w.op) || !['AND','OR'].includes(w.glue)) throw new Error('Operator WHERE tidak didukung.'); const col = column(w.column); let tail = '';
    if (w.op === 'IN') { let values: unknown; try { values = JSON.parse(w.value); } catch { throw new Error('Nilai IN harus array JSON, misalnya [1,2] atau ["a","b"].'); } if (!Array.isArray(values) || !values.length || values.length > 1000 || values.some(v => !['string','number','boolean'].includes(typeof v) || typeof v === 'number' && !Number.isFinite(v))) throw new Error('IN memerlukan 1–1000 nilai scalar non-null.'); tail = ' (' + values.map(v => bind(v)).join(', ') + ')'; }
    else if (!w.op.includes('NULL')) { const [table, name] = w.column.split('.'); const type = s.tables.find(t => t.name === table)!.columns.find(c => c.name === name)!.type; let value: string | number | boolean = w.value; if (/^(BIGINT|INT|INTEGER|SMALLINT|TINYINT|DECIMAL|FLOAT|DOUBLE|NUMERIC)/.test(type) && w.op !== 'LIKE') { if (!w.value.trim() || !Number.isFinite(+w.value)) throw new Error('Kolom angka memerlukan nilai numerik.'); value = +w.value; } if (type === 'BOOLEAN') { if (!['true','false','1','0'].includes(w.value)) throw new Error('Boolean memakai true, false, 1, atau 0.'); value = ['true','1'].includes(w.value); } tail = ' ' + bind(value); }
    out += (i === 0 ? '\nWHERE ' : '\n  ' + w.glue + ' ') + col + ' ' + w.op + tail;
  }
  if (query.order) { if (!['ASC','DESC'].includes(query.direction)) throw new Error('Arah pengurutan tidak valid.'); out += '\nORDER BY ' + column(query.order) + ' ' + query.direction; }
  if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100000) throw new Error('LIMIT harus berupa bilangan bulat 1–100000.');
  return { sql: out + '\nLIMIT ' + query.limit + ';', params };
}
