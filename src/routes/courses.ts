import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";

import {
  courses,
  sections,
  subsections,
  enrollments,
  progress as userProgress,
} from "../db/schema.js";

export const courseRoute = new Hono();




// ✅ Get full data for multiple courses (sections + subsections)
// ✅ Get full data for multiple courses (sections + subsections)
courseRoute.get("/course/full", async (c) => {
  const idsParam = c.req.query("ids"); // e.g. "id1,id2,id3"
  console.log("✅ [API] Received course IDs param:", idsParam);

  if (!idsParam) {
    console.log("❌ [API] No course IDs provided");
    return c.json({ error: "No course IDs provided" }, 400);
  }

  const courseIds = idsParam.split(",").map(id => id.trim()).filter(Boolean);
  console.log("🧪 [API] Parsed course IDs:", courseIds);

  if (courseIds.length === 0) {
    console.log("❌ [API] Course IDs array is empty after parsing");
    return c.json({ error: "No valid course IDs found" }, 400);
  }

  const allCourses = await db
    .select()
    .from(courses)
    .where(inArray(courses.id, courseIds));

  console.log("📦 [API] Found courses:", allCourses);

  if (!allCourses.length) {
    console.log("❌ [API] No matching courses found in DB for IDs:", courseIds);
    return c.json({ error: "No courses found" }, 404);
  }

  const allSections = await db
    .select()
    .from(sections)
    .where(inArray(sections.courseId, courseIds));

  console.log("📚 [API] Found sections:", allSections);

  const sectionIds = allSections.map((sec) => sec.id);
  console.log("🔗 [API] Section IDs:", sectionIds);

  const allSubsections = sectionIds.length
    ? await db
        .select()
        .from(subsections)
        .where(inArray(subsections.sectionId, sectionIds))
    : [];

  console.log("🧩 [API] Found subsections:", allSubsections);

  const coursesWithData = allCourses.map((course) => {
    const courseSections = allSections.filter((s) => s.courseId === course.id);
    const structuredSections = courseSections.map((section) => ({
      ...section,
      subsections: allSubsections.filter((ss) => ss.sectionId === section.id),
    }));

    return {
      ...course,
      sections: structuredSections,
    };
  });

  console.log("✅ [API] Returning structured courses:", coursesWithData);

  return c.json(coursesWithData);
});


// ✅ Get all courses
courseRoute.get("/courses", async (c) => {
  const allCourses = await db.select().from(courses);
  return c.json(allCourses);
});

// ✅ Get course by ID
courseRoute.get("/course/:id", async (c) => {
  const courseId = c.req.param("id");
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  return c.json(course);
});



// ✅ Enroll a user in a course
courseRoute.post("/enrollments", async (c) => {
  const { userId, courseId } = await c.req.json();

  if (!userId || !courseId)
    return c.json({ error: "User ID and Course ID are required" }, 400);

  const [userExists] = await db.select().from(user).where(eq(user.id, userId));
  if (!userExists) return c.json({ error: "User not found" }, 404);

  const [courseExists] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  if (!courseExists) return c.json({ error: "Course not found" }, 404);

  const already = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  if (already.length)
    return c.json({ error: "Already enrolled in this course" }, 400);

  const result = await db
    .insert(enrollments)
    .values({ userId, courseId })
    .returning();

  return c.json(result[0], 201);
});

// ✅ Get enrolled courses for user (GET legacy)
courseRoute.get("/user/:userId/enrollments", async (c) => {
  const userId = c.req.param("userId");

  const enrolled = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  return c.json(enrolled);
});

// ✅ Get enrolled courses for user (POST modern)
courseRoute.post("/enrollments/list", async (c) => {
  const { userId } = await c.req.json();

  if (!userId)
    return c.json({ error: "User ID is required" }, 400);

  const enrolled = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  return c.json(enrolled);
});

// ✅ Save user progress (mark subsection as completed)
courseRoute.post("/progress", async (c) => {
  const { userId, subsectionId } = await c.req.json();

  if (!userId || !subsectionId)
    return c.json({ error: "User ID and Subsection ID are required" }, 400);

  const [subsection] = await db
    .select()
    .from(subsections)
    .where(eq(subsections.id, subsectionId));
  if (!subsection) return c.json({ error: "Subsection not found" }, 404);

  const alreadyCompleted = await db
    .select()
    .from(userProgress)
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.subsectionId, subsectionId)
    ))
    .limit(1);

  if (alreadyCompleted.length)
    return c.json({ message: "Already marked as completed" }, 200);

  const result = await db
    .insert(userProgress)
    .values({ userId, subsectionId })
    .returning();

  return c.json(result[0], 201);
});

// ✅ Get user progress by course
courseRoute.get("/user/:userId/course/:courseId/progress", async (c) => {
  const { userId, courseId } = c.req.param();

  const courseSections = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId));

  const sectionIds = courseSections.map((sec) => sec.id);

  const allSubsections = sectionIds.length
    ? await db
        .select()
        .from(subsections)
        .where(inArray(subsections.sectionId, sectionIds))
    : [];

  const totalSubsections = allSubsections.length;

  const userCompleted = totalSubsections
    ? await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            inArray(userProgress.subsectionId, allSubsections.map((s) => s.id))
          )
        )
    : [];

  const progressPercent = totalSubsections
    ? Math.floor((userCompleted.length / totalSubsections) * 100)
    : 0;

  return c.json({
    courseId,
    totalSubsections,
    completed: userCompleted.length,
    progressPercent,
  });
});

export default courseRoute;
