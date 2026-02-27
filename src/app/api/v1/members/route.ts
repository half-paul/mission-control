import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { createMemberSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError } from "@/lib/errors";
import { isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET /api/v1/members
export async function GET() {
  try {
    const rows = await db
      .select({
        id: members.id,
        email: members.email,
        name: members.name,
        avatarUrl: members.avatarUrl,
        role: members.role,
        agentId: members.agentId,
        createdAt: members.createdAt,
      })
      .from(members)
      .where(isNull(members.deletedAt))
      .orderBy(members.name);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/members
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createMemberSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const [member] = await db
      .insert(members)
      .values({
        email: data.email,
        passwordHash,
        name: data.name,
        avatarUrl: data.avatarUrl,
        role: data.role,
        agentId: data.agentId,
      })
      .returning({
        id: members.id,
        email: members.email,
        name: members.name,
        role: members.role,
        agentId: members.agentId,
        createdAt: members.createdAt,
      });

    await logActivity("member_created", "member", member.id, null, {
      name: data.name,
      email: data.email,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
