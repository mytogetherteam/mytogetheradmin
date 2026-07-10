import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Store, Plus, Trash2, ChevronDown, ChevronUp, UserPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  userGroupService,
  type UserGroup,
} from "@/services/userGroupService";
import {
  shopGroupService,
  type ShopGroup,
} from "@/services/shopGroupService";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { manageUsersService } from "@/services/manageUsersService";
import { ShopService } from "@/services/shopService";

export function BroadcastGroupsDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "shops">("users");

  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [shopGroups, setShopGroups] = useState<ShopGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [selectedToAdd, setSelectedToAdd] = useState<{ label: string; value: string } | null>(null);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups(activeTab);
      setExpandedGroupId(null);
    }
  }, [open, activeTab]);

  const loadGroups = async (type: "users" | "shops") => {
    try {
      setLoadingGroups(true);
      if (type === "users") {
        const data = await userGroupService.getGroups();
        setUserGroups(data);
      } else {
        const data = await shopGroupService.getGroups();
        setShopGroups(data);
      }
    } catch (e) {
      toast.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      setCreating(true);
      if (activeTab === "users") {
        await userGroupService.createGroup(newGroupName);
      } else {
        await shopGroupService.createGroup(newGroupName);
      }
      toast.success("Group created");
      setNewGroupName("");
      loadGroups(activeTab);
    } catch (e) {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      if (activeTab === "users") {
        await userGroupService.deleteGroup(id);
      } else {
        await shopGroupService.deleteGroup(id);
      }
      toast.success("Group deleted");
      if (expandedGroupId === id) setExpandedGroupId(null);
      loadGroups(activeTab);
    } catch (e) {
      toast.error("Failed to delete group");
    }
  };

  const toggleGroup = async (id: number) => {
    if (expandedGroupId === id) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(id);
    setSelectedToAdd(null);
    try {
      setLoadingMembers(true);
      if (activeTab === "users") {
        const data = await userGroupService.getGroupMembers(id);
        setGroupMembers(data);
      } else {
        const data = await shopGroupService.getGroupMembers(id);
        setGroupMembers(data);
      }
    } catch (e) {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!expandedGroupId || !selectedToAdd) return;
    try {
      setAddingMember(true);
      if (activeTab === "users") {
        await userGroupService.addUserToGroup(expandedGroupId, Number(selectedToAdd.value));
      } else {
        await shopGroupService.addShopToGroup(expandedGroupId, Number(selectedToAdd.value));
      }
      toast.success("Member added");
      setSelectedToAdd(null);
      // reload members and update group count
      toggleGroup(expandedGroupId);
      loadGroups(activeTab);
    } catch (e) {
      toast.error("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number, targetId: number) => {
    if (!expandedGroupId) return;
    try {
      if (activeTab === "users") {
        await userGroupService.removeUserFromGroup(expandedGroupId, targetId);
      } else {
        await shopGroupService.removeShopFromGroup(expandedGroupId, targetId);
      }
      setGroupMembers((prev) => prev.filter((m) => m.id !== memberId));
      loadGroups(activeTab);
    } catch (e) {
      toast.error("Failed to remove member");
    }
  };

  const fetchUserData = useCallback(async (p: number, size: number, search: string) => {
    const res = await manageUsersService.getManageUsers({ page: p, size, search, accountType: "user" });
    return {
      content: (res?.content || []).map((u) => ({
        label: u.name || u.email || u.username || `User #${u.id}`,
        value: String(u.id),
      })),
      last: res ? p >= (res.totalPages ?? 1) : true,
    };
  }, []);

  const fetchShopData = useCallback(async (p: number, size: number, search: string) => {
    const res = await ShopService.getAdminShopProfiles(p, size, search);
    return {
      content: (res?.content || []).map((s) => ({
        label: s.nameEn || s.nameMm || s.nameTh || `Shop #${s.id}`,
        value: String(s.id),
      })),
      last: res ? p >= (res.totalPages ?? 1) : true,
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" /> Manage Groups
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Broadcast Groups</DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" /> User Groups
            </TabsTrigger>
            <TabsTrigger value="shops">
              <Store className="h-4 w-4 mr-2" /> Shop Groups
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 mb-4 shrink-0">
            <Input
              placeholder={`New ${activeTab === "users" ? "User" : "Shop"} Group Name...`}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loadingGroups ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (activeTab === "users" ? userGroups : shopGroups).length === 0 ? (
              <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-md">
                No groups found. Create one above!
              </div>
            ) : (
              (activeTab === "users" ? userGroups : shopGroups).map((g) => {
                const isExpanded = expandedGroupId === g.id;
                return (
                  <div key={g.id} className="border rounded-md bg-card">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleGroup(g.id)}
                    >
                      <div>
                        <h4 className="font-medium text-sm">{g.name}</h4>
                        <p className="text-xs text-muted-foreground">{g._count?.members || 0} members</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(g.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t bg-muted/10">
                        <div className="flex gap-2 items-end my-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Add Member
                            </label>
                            <InfiniteSearchableSelect
                              fetchData={activeTab === "users" ? fetchUserData : fetchShopData}
                              startPage={1}
                              valueKey="value"
                              labelKey="label"
                              selectedValue={selectedToAdd}
                              onChange={(item) => setSelectedToAdd(item as any)}
                              placeholder={`Search ${activeTab === "users" ? "user" : "shop"}...`}
                            />
                          </div>
                          <Button onClick={handleAddMember} disabled={!selectedToAdd || addingMember}>
                            {addingMember ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Add
                          </Button>
                        </div>

                        {loadingMembers ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : groupMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center p-4">No members yet.</p>
                        ) : (
                          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                            {groupMembers.map((m) => {
                              const title = activeTab === "users" ? m.user?.name || m.user?.email : m.shop?.nameEn || m.shop?.nameMm;
                              const targetId = activeTab === "users" ? m.userId : m.shopId;
                              return (
                                <div key={m.id} className="flex items-center justify-between bg-background p-2 border rounded text-sm">
                                  <span>{title || `#${targetId}`}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveMember(m.id, targetId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
