CREATE TABLE `workoutSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` varchar(128) NOT NULL,
	`durationMinutes` int NOT NULL,
	`totalVolumeCentiKg` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(128) NOT NULL,
	`setNumber` int NOT NULL,
	`reps` int NOT NULL,
	`weightCentiKg` int NOT NULL,
	`volumeCentiKg` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutSets_id` PRIMARY KEY(`id`)
);
