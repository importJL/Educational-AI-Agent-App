CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`pageCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`documentName` varchar(255) NOT NULL,
	`pageStart` int,
	`pageEnd` int,
	`taskType` enum('Summarize','Extract Key Points','Generate Diagram/Infographic description','Custom Instructions') NOT NULL,
	`customInstructions` text,
	`response` text NOT NULL,
	`responseFormat` enum('markdown','text','json') NOT NULL DEFAULT 'markdown',
	`model` varchar(128),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultModel` varchar(128) NOT NULL DEFAULT 'google/gemma-4-31b-it:free',
	`theme` enum('light','dark') NOT NULL DEFAULT 'light',
	`fontSize` enum('small','medium','large') NOT NULL DEFAULT 'medium',
	`pdfZoomLevel` int DEFAULT 100,
	`autoSaveResponses` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
