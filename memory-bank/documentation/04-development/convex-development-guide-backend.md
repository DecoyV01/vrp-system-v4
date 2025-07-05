# Convex Development Guide: Best Practices, Design Patterns & Built-in Features

## Table of Contents
1. [Core Principles & Best Practices](#core-principles--best-practices)
2. [Database Design Patterns](#database-design-patterns)
3. [Function Architecture](#function-architecture)
4. [Built-in Features](#built-in-features)
5. [Performance Optimization](#performance-optimization)
6. [Security & Authentication](#security--authentication)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Development Lifecycle](#development-lifecycle)

---

## Core Principles & Best Practices

### 1. Function Organization & Architecture

#### ✅ Model-API Separation Pattern
```typescript
// convex/model/users.ts - Business logic layer
import { QueryCtx, MutationCtx } from '../_generated/server';

export async function getCurrentUser(ctx: QueryCtx) {
  const userIdentity = await ctx.auth.getUserIdentity();
  if (userIdentity === null) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.query("users")
    .withIndex("by_token", q => q.eq("tokenIdentifier", userIdentity.tokenIdentifier))
    .unique();
  return user;
}

// convex/users.ts - Thin API layer
import * as Users from './model/users';

export const getCurrentUser = query({
  handler: async (ctx) => {
    return Users.getCurrentUser(ctx);
  },
});
```

#### ❌ Avoid: Multiple Sequential Function Calls
```typescript
// BAD: Multiple function calls in sequence
const foo = await ctx.runQuery(api.module.getFoo);
const bar = await ctx.runQuery(api.module.getBar);

// GOOD: Single consolidated function
const fooAndBar = await ctx.runQuery(api.module.getFooAndBar);
```

### 2. Database Query Optimization

#### ✅ Use Indexes for Filtering
```typescript
// GOOD: Using indexes for efficient queries
export const getMessagesByAuthor = query({
  args: { author: v.string() },
  handler: async (ctx, { author }) => {
    return await ctx.db.query("messages")
      .withIndex("by_author", q => q.eq("author", author))
      .collect();
  }
});
```

#### ❌ Avoid: Filter on Large Datasets
```typescript
// BAD: Filtering after collecting all data
const allMessages = await ctx.db.query("messages").collect();
return allMessages.filter(m => m.author === "Alice");

// GOOD: Use indexes or limit results
return await ctx.db.query("messages")
  .withIndex("by_author", q => q.eq("author", "Alice"))
  .collect();
```

#### ✅ Pagination for Large Datasets
```typescript
import { paginationOptsValidator } from "convex/server";

export const getPaginatedMessages = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query("messages")
      .order("desc")
      .paginate(paginationOpts);
  }
});
```

---

## Database Design Patterns

### 1. Schema Design Best Practices

#### Efficient Indexing Strategy
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
  .index("by_token", ["tokenIdentifier"])
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_status_created", ["status", "createdAt"]),
  
  messages: defineTable({
    text: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    createdAt: v.number(),
  })
  .index("by_author", ["authorId"])
  .index("by_channel", ["channelId"])
  .index("by_channel_created", ["channelId", "createdAt"]),
});
```

#### Index Optimization Rules
- **Avoid redundant indexes**: Use composite indexes for multiple query patterns
- **Order matters**: Index fields in order of query frequency
- **Limit indexes**: Maximum 32 indexes per table, plan carefully
- **Use specific indexes**: Prefer `by_team_and_user` over separate `by_team` and `by_user`

### 2. Relationship Patterns

#### One-to-Many Relationships
```typescript
// Helper functions for relationship traversal
import { getManyFrom, getOneFromOrThrow } from "convex-helpers/server/relationships";

export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await getManyFrom(ctx.db, "posts", "authorId", userId);
  }
});
```

#### Many-to-Many via Join Tables
```typescript
// Schema for many-to-many
userRoles: defineTable({
  userId: v.id("users"),
  roleId: v.id("roles"),
})
.index("by_user", ["userId"])
.index("by_role", ["roleId"])
.index("by_user_role", ["userId", "roleId"]),
```

### 3. Data Validation & Type Safety

#### Branded String Validators
```typescript
import { brandedString } from "convex-helpers/validators";

export const emailValidator = brandedString("email");
export type Email = Infer<typeof emailValidator>;

export default defineSchema({
  users: defineTable({
    email: emailValidator,
    // ...
  }),
});
```

---

## Function Architecture

### 1. Function Types & Use Cases

#### Queries: Read-Only Data Access
```typescript
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    return user;
  }
});
```

#### Mutations: Transactional Database Operations
```typescript
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
      publishedAt: null,
    });
    
    // Increment user post count atomically
    const user = await ctx.db.get(args.authorId);
    await ctx.db.patch(args.authorId, { 
      postCount: (user?.postCount ?? 0) + 1 
    });
    
    return postId;
  }
});
```

#### Actions: External Integrations
```typescript
export const generateSummary = action({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    // 1. Fetch data
    const post = await ctx.runQuery(api.posts.get, { id: postId });
    
    // 2. External API call
    const summary = await generateAISummary(post.content);
    
    // 3. Update database
    await ctx.runMutation(api.posts.updateSummary, { 
      id: postId, 
      summary 
    });
  }
});
```

### 2. Advanced Function Patterns

#### Custom Function Builders
```typescript
import { customQuery } from "convex-helpers/server/customFunctions";

// Custom query with automatic authentication
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { ctx: { ...ctx, user }, args: {} };
  },
});

export const getMyPosts = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // ctx.user is automatically available
    return await ctx.db.query("posts")
      .withIndex("by_author", q => q.eq("authorId", ctx.user._id))
      .collect();
  }
});
```

#### Row-Level Security Pattern
```typescript
import { wrapDatabaseReader } from "convex-helpers/server/rowLevelSecurity";

const rlsRules = {
  posts: {
    read: async (ctx, post) => {
      const user = await getCurrentUser(ctx);
      return post.published || post.authorId === user._id;
    }
  }
};

export const secureQuery = customQuery(query, customCtx(async (ctx) => ({
  db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx)),
})));
```

---

## Built-in Features

### 1. Vector Search & AI Integration

#### Setting Up Vector Search
```typescript
// Schema with vector index
export default defineSchema({
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    category: v.string(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI embedding size
    filterFields: ["category"],
  }),
});

// Vector search action
export const searchSimilarDocs = action({
  args: { query: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, { query, category }) => {
    // Generate embedding
    const embedding = await generateEmbedding(query);
    
    // Search with optional filtering
    const results = await ctx.vectorSearch("documents", "by_embedding", {
      vector: embedding,
      limit: 10,
      filter: category ? q => q.eq("category", category) : undefined,
    });
    
    // Fetch full documents
    const docs = await ctx.runQuery(api.documents.getByIds, {
      ids: results.map(r => r._id)
    });
    
    return docs.map((doc, i) => ({
      ...doc,
      similarity: results[i]._score
    }));
  }
});
```

### 2. File Storage

#### Complete File Upload Flow
```typescript
// Generate upload URL
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // Optional: Add authentication check
    const user = await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    return await ctx.db.insert("files", {
      ...args,
      ownerId: user._id,
      uploadedAt: Date.now(),
    });
  },
});

// Serve files via HTTP
http.route({
  path: "/files/:fileId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const fileId = request.pathParams.fileId;
    const file = await ctx.db.get(fileId as Id<"files">);
    
    if (!file) {
      return new Response("File not found", { status: 404 });
    }
    
    const blob = await ctx.storage.get(file.storageId);
    return new Response(blob, {
      headers: { "Content-Type": file.type },
    });
  }),
});
```

### 3. Authentication Integration

#### Multi-Provider Auth Setup
```typescript
// Convex Auth configuration
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
  }).index("email", ["email"]),
  
  sessions: defineTable({
    userId: v.id("users"),
    expires: v.number(),
    sessionToken: v.string(),
  }).index("sessionToken", ["sessionToken"]),
  
  accounts: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("email"), v.literal("oauth")),
    provider: v.string(),
    providerAccountId: v.string(),
  }).index("providerAndAccountId", ["provider", "providerAccountId"]),
});

// Authentication helper
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  return await ctx.db.query("users")
    .withIndex("email", q => q.eq("email", identity.email))
    .unique();
}
```

### 4. Scheduled Functions & Cron Jobs

#### Background Task Processing
```typescript
// Schedule recurring tasks
export const processExpiredSessions = mutation({
  handler: async (ctx) => {
    const expiredSessions = await ctx.db.query("sessions")
      .filter(q => q.lt(q.field("expires"), Date.now()))
      .collect();
    
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }
    
    // Schedule next cleanup
    await ctx.scheduler.runAfter(
      24 * 60 * 60 * 1000, // 24 hours
      api.auth.processExpiredSessions
    );
  }
});

// Cron-based scheduling
export const dailyReports = mutation({
  handler: async (ctx) => {
    // Generate daily analytics
    const stats = await generateDailyStats(ctx);
    
    // Send report
    await ctx.runAction(api.notifications.sendDailyReport, { stats });
  }
});
```

### 5. Real-time Subscriptions

#### Live Data Patterns
```typescript
// Real-time chat messages
export const getChannelMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const user = await getCurrentUser(ctx);
    
    // Check channel access
    const membership = await ctx.db.query("channelMemberships")
      .withIndex("by_user_channel", q => 
        q.eq("userId", user._id).eq("channelId", channelId))
      .unique();
    
    if (!membership) throw new Error("Access denied");
    
    return await ctx.db.query("messages")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .order("desc")
      .take(50);
  }
});

// React component with real-time updates
function ChatChannel({ channelId }: { channelId: Id<"channels"> }) {
  const messages = useQuery(api.chat.getChannelMessages, { channelId });
  const sendMessage = useMutation(api.chat.sendMessage);
  
  // Messages automatically update when new ones are sent
  return (
    <div>
      {messages?.map(message => (
        <div key={message._id}>{message.text}</div>
      ))}
    </div>
  );
}
```

---

## Performance Optimization

### 1. Query Optimization Strategies

#### Index Usage Patterns
```typescript
// Efficient compound index usage
messages: defineTable({
  channelId: v.id("channels"),
  authorId: v.id("users"),
  createdAt: v.number(),
  priority: v.string(),
})
.index("by_channel_priority_created", ["channelId", "priority", "createdAt"])
.index("by_author_created", ["authorId", "createdAt"]),

// Query that leverages compound index efficiently
export const getUrgentMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    return await ctx.db.query("messages")
      .withIndex("by_channel_priority_created", q => 
        q.eq("channelId", channelId).eq("priority", "urgent"))
      .order("desc")
      .take(20);
  }
});
```

#### Batch Operations
```typescript
// Efficient bulk operations
export const createMultiplePosts = mutation({
  args: { posts: v.array(v.object({ title: v.string(), content: v.string() })) },
  handler: async (ctx, { posts }) => {
    const user = await getCurrentUser(ctx);
    const results = [];
    
    // Single transaction for all inserts
    for (const post of posts) {
      const id = await ctx.db.insert("posts", {
        ...post,
        authorId: user._id,
        createdAt: Date.now(),
      });
      results.push(id);
    }
    
    return results;
  }
});
```

### 2. Caching Strategies

#### Query Result Caching
```typescript
import { useQuery } from "convex-helpers/react/cache";

// Cached query hook (client-side)
function UserProfile({ userId }: { userId: Id<"users"> }) {
  // Automatically cached across components
  const user = useQuery(api.users.get, { id: userId });
  return <div>{user?.name}</div>;
}
```

### 3. Memory & Resource Management

#### Limits & Best Practices
- **Document size**: Max 1MB per document
- **Function execution**: 1 second for queries/mutations, 10 minutes for actions
- **Concurrent operations**: Max 1000 per function
- **Data read/written**: 8 MiB per transaction
- **Return value size**: 8 MiB max

---

## Security & Authentication

### 1. Access Control Patterns

#### Function-Level Security
```typescript
// Granular permission checking
export const updatePost = mutation({
  args: { 
    id: v.id("posts"), 
    updates: v.object({ title: v.optional(v.string()) })
  },
  handler: async (ctx, { id, updates }) => {
    const user = await getCurrentUser(ctx);
    const post = await ctx.db.get(id);
    
    if (!post) throw new Error("Post not found");
    
    // Only author or admin can edit
    if (post.authorId !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.patch(id, updates);
  }
});
```

#### Data Validation
```typescript
import { z } from "zod";
import { zCustomMutation } from "convex-helpers/server/zod";

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(13).max(120),
});

export const createUser = zCustomMutation(mutation, NoOp)({
  args: createUserSchema,
  handler: async (ctx, args) => {
    // args are fully validated and typed
    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  }
});
```

### 2. Rate Limiting

#### Built-in Rate Limiting
```typescript
import { defineRateLimit } from "convex-helpers/server/rateLimit";

const apiCallLimit = defineRateLimit({
  kind: "fixed window",
  period: 60 * 1000, // 1 minute
  count: 100, // 100 calls per minute
});

export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Apply rate limit per user
    await apiCallLimit(ctx, user._id);
    
    return await ctx.db.insert("posts", {
      ...args,
      authorId: user._id,
      createdAt: Date.now(),
    });
  }
});
```

---

## Testing & Quality Assurance

### 1. Unit Testing with convex-test

#### Basic Test Setup
```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("user creation and retrieval", async () => {
  const t = convexTest(schema);
  
  // Create user
  const userId = await t.mutation(api.users.create, {
    name: "Alice",
    email: "alice@example.com",
  });
  
  // Verify user was created
  const user = await t.query(api.users.get, { id: userId });
  expect(user?.name).toBe("Alice");
  expect(user?.email).toBe("alice@example.com");
});
```

#### Testing with Authentication
```typescript
test("authenticated operations", async () => {
  const t = convexTest(schema);
  
  // Test as specific user
  const asAlice = t.withIdentity({ 
    name: "Alice", 
    email: "alice@example.com" 
  });
  
  await asAlice.mutation(api.posts.create, {
    title: "Test Post",
    content: "Hello world",
  });
  
  const posts = await asAlice.query(api.posts.getMyPosts);
  expect(posts).toHaveLength(1);
  expect(posts[0].title).toBe("Test Post");
});
```

### 2. Integration Testing

#### End-to-End Workflows
```typescript
test("complete post creation workflow", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ name: "Bob" });
  
  // 1. Create post
  const postId = await asUser.mutation(api.posts.create, {
    title: "My Post",
    content: "Post content",
  });
  
  // 2. Verify in listing
  const allPosts = await t.query(api.posts.list);
  expect(allPosts).toContainEqual(
    expect.objectContaining({ title: "My Post" })
  );
  
  // 3. Test permissions
  const asDifferentUser = t.withIdentity({ name: "Charlie" });
  await expect(
    asDifferentUser.mutation(api.posts.delete, { id: postId })
  ).rejects.toThrow("Unauthorized");
});
```

---

## Development Lifecycle

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Start development server
npx convex dev

# Generate types
npx convex codegen

# Run tests
npm test
```

### 2. Schema Migrations

#### Safe Schema Evolution
```typescript
// Migration helper
import { migration } from "convex-helpers/server/migrations";

export const addUserPreferences = migration({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (!user.preferences) {
      await ctx.db.patch(user._id, {
        preferences: {
          theme: "light",
          notifications: true,
        }
      });
    }
  }
});
```

### 3. Deployment Pipeline

```bash
# Production deployment
npx convex deploy --prod

# Environment management
npx convex env set OPENAI_API_KEY "your-key" --prod

# Monitor logs
npx convex logs --tail
```

### 4. Monitoring & Observability

#### Performance Monitoring
```typescript
// Function execution metrics
export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      const result = await ctx.db.insert("posts", {
        ...args,
        createdAt: Date.now(),
      });
      
      // Log success metrics
      console.log(`Post created in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error) {
      // Log error metrics
      console.error("Post creation failed:", error);
      throw error;
    }
  }
});
```

---

## Component & Helper Libraries

### 1. Convex Helpers Integration

```bash
npm install convex-helpers@latest
```

#### Common Utilities
```typescript
// CRUD operations
import { crud } from "convex-helpers/server/crud";
export const { create, read, update, destroy } = crud(schema, "users");

// Relationship helpers
import { getManyFrom, getOneFromOrThrow } from "convex-helpers/server/relationships";

// Validation helpers
import { brandedString, literals } from "convex-helpers/validators";

// Pagination helpers
import { paginator } from "convex-helpers/server/pagination";
```

### 2. OpenAPI Integration

```bash
# Generate API specs
npx convex-helpers open-api-spec
npx convex-helpers ts-api-spec
```

---

## Resource Limits & Quotas

### Function Limits
- **Execution time**: 1s (queries/mutations), 10min (actions)
- **Memory**: 64 MiB (default runtime), 512 MiB (Node.js)
- **Function calls**: 1M/month (Starter), 25M/month (Pro)
- **Code size**: 32 MiB per deployment

### Database Limits
- **Document size**: 1 MB maximum
- **Nesting depth**: 16 levels maximum
- **Indexes per table**: 32 maximum
- **Vector indexes per table**: 4 maximum
- **Documents per transaction**: 8,192 read/write

### Storage Limits
- **File size**: No specific limit (within reason)
- **Upload URL validity**: 1 hour
- **Storage quota**: Based on plan

---

## Conclusion

This guide provides a comprehensive foundation for building robust, scalable applications with Convex. The key principles to remember:

1. **Organize code with model-API separation**
2. **Use indexes efficiently for query performance**
3. **Leverage built-in features (vector search, auth, storage)**
4. **Implement proper security and validation**
5. **Test thoroughly with convex-test**
6. **Monitor performance and resource usage**

For the latest updates and detailed API documentation, always refer to the [official Convex documentation](https://docs.convex.dev).