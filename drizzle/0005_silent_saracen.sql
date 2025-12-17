CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` varchar(128) NOT NULL,
	`auth` varchar(32) NOT NULL,
	`prefecture` varchar(20) NOT NULL,
	`user_agent` text,
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `push_prefecture_idx` ON `push_subscriptions` (`prefecture`);--> statement-breakpoint
CREATE INDEX `push_active_idx` ON `push_subscriptions` (`active`);