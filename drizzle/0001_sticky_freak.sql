CREATE TABLE `bear_sightings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_type` enum('official','user') NOT NULL,
	`user_id` int,
	`prefecture` varchar(64) NOT NULL,
	`city` varchar(128),
	`location` text,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`sighted_at` timestamp NOT NULL,
	`bear_type` varchar(64),
	`description` text,
	`source_url` text,
	`image_url` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bear_sightings_id` PRIMARY KEY(`id`)
);
