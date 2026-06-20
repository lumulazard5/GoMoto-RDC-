import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Define the 'users' table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  role: text("role").default("client"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the 'legalization_reviews' table
export const legalizationReviews = pgTable("legalization_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  centerId: text("center_id").notNull(), // Matches id like 'lc-1', 'lc-2'
  rating: integer("rating").notNull(),   // 1 to 5 stars
  comment: text("comment").notNull(),
  status: text("status").default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relationships for 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(legalizationReviews),
}));

// Define relationships for 'legalization_reviews' table
export const legalizationReviewsRelations = relations(legalizationReviews, ({ one }) => ({
  author: one(users, {
    fields: [legalizationReviews.userId],
    references: [users.id],
  }),
}));
