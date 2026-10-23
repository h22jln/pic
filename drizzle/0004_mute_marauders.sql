CREATE TABLE `qr_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`frame_id` text NOT NULL,
	`frame_title` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` integer NOT NULL
);
