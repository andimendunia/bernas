"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users } from "lucide-react"
import { Member } from "@/lib/permissions"

type Tag = {
  id: string
  name: string
  color: string | null
}

type MemberSkill = {
  id: string
  member_id: string
  tag_id: string
  event_tags: Tag
  org_members: {
    id: string
    user_id: string
    is_admin: boolean
  }
}

type SkillsProps = {
  organizationId: string
  tags: Tag[]
  memberSkills: MemberSkill[]
  members: Member[]
  currentMemberId?: string
  canAssignSelf: boolean
  canAssignOthers: boolean
  canRemoveSelf: boolean
  canRemoveOthers: boolean
  onSkillsUpdated: () => void
}

export function Skills({
  organizationId,
  tags,
  memberSkills,
  members,
  currentMemberId,
  canAssignSelf,
  canAssignOthers,
  canRemoveSelf,
  canRemoveOthers,
  onSkillsUpdated,
}: SkillsProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  // Group skills with their members
  const skillsWithMembers = React.useMemo(() => {
    const skillMap = new Map<string, { tag: Tag; memberIds: string[] }>()

    // Initialize all tags as skills (even if no one has them yet)
    tags.forEach((tag) => {
      skillMap.set(tag.id, { tag, memberIds: [] })
    })

    // Add members who have each skill
    memberSkills.forEach((ms) => {
      const existing = skillMap.get(ms.tag_id)
      if (existing && !existing.memberIds.includes(ms.member_id)) {
        existing.memberIds.push(ms.member_id)
      }
    })

    return Array.from(skillMap.values())
  }, [tags, memberSkills])

  // Filter skills
  const filteredSkills = skillsWithMembers.filter((skill) =>
    searchQuery === "" ||
    skill.tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUserName = (member: Member) => {
    return (
      member.user.user_metadata.full_name ||
      member.user.user_metadata.name ||
      member.user.email.split('@')[0]
    )
  }

  const getUserInitials = (member: Member) => {
    const name = getUserName(member)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header with search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredSkills.length} {filteredSkills.length === 1 ? "skill" : "skills"}
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No skills match your search"
                : "No skills yet. Create tags to use as skills."}
            </p>
          </div>
        ) : (
          filteredSkills.map((skill) => {
            const skillMembers = members.filter((m) =>
              skill.memberIds.includes(m.id)
            )
            const displayMembers = skillMembers.slice(0, 5)
            const remainingCount = skillMembers.length - 5

            return (
              <div
                key={skill.tag.id}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-base">
                        {skill.tag.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="size-4" />
                        <span>
                          {skillMembers.length}
                        </span>
                      </div>
                    </div>

                    {skillMembers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {displayMembers.map((member) => (
                            <Avatar
                              key={member.id}
                              className="size-8 border-2 border-background"
                            >
                              <AvatarImage
                                src={
                                  member.user.user_metadata.avatar_url ||
                                  member.user.user_metadata.picture
                                }
                                alt={getUserName(member)}
                              />
                              <AvatarFallback className="bg-primary/20 text-xs">
                                {getUserInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        {remainingCount > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canAssignSelf && currentMemberId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {skill.memberIds.includes(currentMemberId)
                          ? "Remove"
                          : "Add me"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Show all members when expanded (future enhancement) */}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
