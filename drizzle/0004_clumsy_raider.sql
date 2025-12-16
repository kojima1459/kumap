CREATE TABLE `email_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`prefecture` varchar(20) NOT NULL,
	`confirm_token` varchar(64) NOT NULL,
	`unsubscribe_token` varchar(64) NOT NULL,
	`confirmed` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`confirmed_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `email_subscriptions` (`email`);--> statement-breakpoint
CREATE INDEX `email_prefecture_idx` ON `email_subscriptions` (`prefecture`);--> statement-breakpoint
CREATE INDEX `confirm_token_idx` ON `email_subscriptions` (`confirm_token`);--> statement-breakpoint
CREATE INDEX `unsubscribe_token_idx` ON `email_subscriptions` (`unsubscribe_token`);