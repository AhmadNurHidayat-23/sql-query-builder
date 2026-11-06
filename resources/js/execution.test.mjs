import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { initial, build, sample } from './query';
it('query dan bindings mengeksekusi JOIN pada SQLite in-memory untuk pengujian', () => {
  const query = initial('users');
  query.joins = [{ table: 'posts', kind: 'INNER', left: 'users.id', right: 'posts.user_id' }];
  query.columns = ['users.name', 'posts.title'];
  query.where = [{ column: 'posts.id', op: '=', value: '2', glue: 'AND' }];
  const data = Buffer.from(JSON.stringify(build(sample, query))).toString('base64');
  const program = `<?php
  $pdo = new PDO('sqlite::memory:');
  $pdo->exec('CREATE TABLE users(id INTEGER, name TEXT, email TEXT)');
  $pdo->exec('CREATE TABLE posts(id INTEGER, user_id INTEGER, title TEXT, published INTEGER)');
  $pdo->exec("INSERT INTO users VALUES(1,'Test User','test@example.com')");
  $pdo->exec("INSERT INTO posts VALUES(2,1,'Test Post',1)");
  $query = json_decode(base64_decode('${data}'), true);
  $statement = $pdo->prepare($query['sql']);
  $statement->execute($query['params']);
  echo json_encode($statement->fetchAll(PDO::FETCH_ASSOC));`;
  const result = spawnSync('php', [], { input: program, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual([{ name: 'Test User', title: 'Test Post' }]);
});
