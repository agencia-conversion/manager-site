import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)

  await db.run(sql`CREATE TABLE \`landing\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`mark\` text,
  	\`nav_flow_label\` text,
  	\`nav_github_label\` text,
  	\`nav_github_url\` text,
  	\`kicker\` text,
  	\`hero_title\` text,
  	\`lede\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`ghost_label\` text,
  	\`ghost_href\` text,
  	\`footer\` text,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`landing__status_idx\` ON \`landing\` (\`_status\`);`)

  await db.run(sql`CREATE TABLE \`landing_flow_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`step\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`landing\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`landing_flow_steps_order_idx\` ON \`landing_flow_steps\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`landing_flow_steps_parent_id_idx\` ON \`landing_flow_steps\` (\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`_landing_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_mark\` text,
  	\`version_nav_flow_label\` text,
  	\`version_nav_github_label\` text,
  	\`version_nav_github_url\` text,
  	\`version_kicker\` text,
  	\`version_hero_title\` text,
  	\`version_lede\` text,
  	\`version_cta_label\` text,
  	\`version_cta_href\` text,
  	\`version_ghost_label\` text,
  	\`version_ghost_href\` text,
  	\`version_footer\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_landing_v_version_version__status_idx\` ON \`_landing_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_landing_v_created_at_idx\` ON \`_landing_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_landing_v_updated_at_idx\` ON \`_landing_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_landing_v_latest_idx\` ON \`_landing_v\` (\`latest\`);`)

  await db.run(sql`CREATE TABLE \`_landing_v_version_flow_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`step\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_landing_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_landing_v_version_flow_steps_order_idx\` ON \`_landing_v_version_flow_steps\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_landing_v_version_flow_steps_parent_id_idx\` ON \`_landing_v_version_flow_steps\` (\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`_landing_v_version_flow_steps\`;`)
  await db.run(sql`DROP TABLE \`_landing_v\`;`)
  await db.run(sql`DROP TABLE \`landing_flow_steps\`;`)
  await db.run(sql`DROP TABLE \`landing\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
}
