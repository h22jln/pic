import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const frames = sqliteTable("frames", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  accent: text("accent").notNull().default("#e6ae75"),
  backgroundColor: text("background_color").notNull().default("#18253b"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  showHero: integer("show_hero", { mode: "boolean" }).notNull().default(true),
  poses: text("poses").notNull().default("[null,null,null,null]"),
  decoration: text("decoration"),
  decorations: text("decorations").notNull().default("[]"),
  hero: text("hero"),
  layout: text("layout").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
