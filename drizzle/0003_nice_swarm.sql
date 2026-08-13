CREATE TABLE `trainingBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainingBackups_id` PRIMARY KEY(`id`),
	CONSTRAINT `trainingBackups_userId_unique` UNIQUE(`userId`)
);
