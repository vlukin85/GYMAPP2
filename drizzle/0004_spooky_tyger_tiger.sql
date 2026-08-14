ALTER TABLE `workoutSets` ADD `setType` varchar(16) DEFAULT 'working' NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutSets` ADD `supersetGroup` varchar(32);