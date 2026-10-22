CREATE TABLE `frames` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`accent` text DEFAULT '#e6ae75' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`show_hero` integer DEFAULT true NOT NULL,
	`poses` text DEFAULT '[null,null,null,null]' NOT NULL,
	`decoration` text,
	`hero` text,
	`layout` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
