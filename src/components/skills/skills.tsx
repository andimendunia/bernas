"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users } from "lucide-react"
import { Member } from "@/lib/permissions"
import { AddSkillDialog } from "./add-skill-dialog"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Skill = {
  id: string
  name: string
  description: string | null
  color: string | null
}

type MemberSkill = {
  id: string
  member_id: string
  skill_id: string
  skills: Skill
  org_members: {
    id: string
    user_id: string
    is_admin: boolean
  }
}

type SkillsProps = {
  organizationId: string
  skills: Skill[]
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
  skills,
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
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [loadingSkills, setLoadingSkills] = React.useState<Set<string>>(new Set())

  const handleToggleSkill = async (skillId: string, currentlyHas: boolean) => {
    if (!currentMemberId) return

    setLoadingSkills((prev) => new Set(prev).add(skillId))

    if (currentlyHas) {
      // Remove skill
      const { error } = await supabase
        .from('member_skills')
        .delete()
        .eq('org_id', organizationId)
        .eq('member_id', currentMemberId)
        .eq('skill_id', skillId)

      if (error) {
        toast.error('Failed to remove skill')
        console.error(error)
      } else {
        toast.success('Skill removed')
        onSkillsUpdated()
      }
    } else {
      // Add skill
      const { error } = await supabase
        .from('member_skills')
        .insert({
          org_id: organizationId,
          member_id: currentMemberId,
          skill_id: skillId,
        })

      if (error) {
        toast.error('Failed to add skill')
        console.error(error)
      } else {
        toast.success('Skill added')
        onSkillsUpdated()
      }
    }

    setLoadingSkills((prev) => {
      const newSet = new Set(prev)
      newSet.delete(skillId)
      return newSet
    })
  }

  // Group skills with their members
  const skillsWithMembers = React.useMemo(() => {
    const skillMap = new Map<string, { skill: Skill; memberIds: string[] }>()

    // Initialize all skills (even if no one has them yet)
    skills.forEach((skill) => {
      skillMap.set(skill.id, { skill, memberIds: [] })
    })

    // Add members who have each skill
    memberSkills.forEach((ms) => {
      const existing = skillMap.get(ms.skill_id)
      if (existing && !existing.memberIds.includes(ms.member_id)) {
        existing.memberIds.push(ms.member_id)
      }
    })

    return Array.from(skillMap.values())
  }, [skills, memberSkills])

  // Filter skills
  const filteredSkills = skillsWithMembers.filter((skill) =>
    searchQuery === "" ||
    skill.skill.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header with search and create button */}
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

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {filteredSkills.length} {filteredSkills.length === 1 ? "skill" : "skills"}
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Skill
          </Button>
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No skills match your search"
                : "No skills yet. Create your first skill to get started."}
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
                key={skill.skill.id}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={currentMemberId && skill.memberIds.includes(currentMemberId) ? "default" : "secondary"} 
                        className="text-base"
                      >
                        {skill.skill.name}
                      </Badge>
                      {currentMemberId && skill.memberIds.includes(currentMemberId) && (
                        <span className="text-xs text-muted-foreground">
                          You have this skill
                        </span>
                      )}
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
                        variant={skill.memberIds.includes(currentMemberId) ? "outline" : "ghost"}
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleToggleSkill(skill.skill.id, skill.memberIds.includes(currentMemberId))}
                        disabled={loadingSkills.has(skill.skill.id)}
                      >
                        {loadingSkills.has(skill.skill.id) ? (
                          "..."
                        ) : skill.memberIds.includes(currentMemberId) ? (
                          "Remove"
                        ) : (
                          "Add me"
                        )}
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

      {/* Add Skill Dialog */}
      <AddSkillDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        organizationId={organizationId}
        onSuccess={onSkillsUpdated}
      />
    </div>
  )
}
