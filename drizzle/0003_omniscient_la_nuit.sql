CREATE INDEX `prefecture_idx` ON `bear_sightings` (`prefecture`);--> statement-breakpoint
CREATE INDEX `sighted_at_idx` ON `bear_sightings` (`sighted_at`);--> statement-breakpoint
CREATE INDEX `source_type_idx` ON `bear_sightings` (`source_type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `bear_sightings` (`status`);--> statement-breakpoint
CREATE INDEX `prefecture_sighted_at_idx` ON `bear_sightings` (`prefecture`,`sighted_at`);