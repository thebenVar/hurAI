-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contact" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyIssues" TEXT NOT NULL,
    "potentialCauses" TEXT NOT NULL,
    "subCategory" TEXT,
    "isUserSolvable" BOOLEAN,
    "userSolvableReason" TEXT,
    "followUpQuestions" TEXT,
    "assignee" TEXT,
    "departmentId" TEXT,
    "creatorId" TEXT,
    "assigneeId" TEXT,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "satisfactionScore" INTEGER,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timeSpent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("assignee", "assigneeId", "category", "contact", "createdAt", "creatorId", "departmentId", "duration", "followUpQuestions", "id", "isUserSolvable", "keyIssues", "potentialCauses", "priority", "sentiment", "source", "status", "subCategory", "summary", "timeSpent", "topic", "updatedAt", "userSolvableReason") SELECT "assignee", "assigneeId", "category", "contact", "createdAt", "creatorId", "departmentId", "duration", "followUpQuestions", "id", "isUserSolvable", "keyIssues", "potentialCauses", "priority", "sentiment", "source", "status", "subCategory", "summary", "timeSpent", "topic", "updatedAt", "userSolvableReason" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
