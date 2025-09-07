"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  TableSortLabel,
  Box,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import {
  Add as AddIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import AddUserModal from "./AddUserModal";

interface UserData {
  email: string;
  displayName: string;
  profileImageURL?: string;
  role: string;
}

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof UserData;
  numeric: boolean;
  label: string;
}

const headCells: readonly HeadCell[] = [
  { id: "displayName", numeric: false, label: "User" },
  { id: "email", numeric: false, label: "Email" },
  { id: "role", numeric: false, label: "Role" },
];

interface OrganizationData {
  slug: string;
  name: string;
  domain: string;
}

interface UsersClientProps {
  organization: OrganizationData;
  users: UserData[];
  currentUserRole: string;
  currentUserEmail: string;
  organizationSlug: string;
}

const roleColors = {
  owner: "error" as const,
  admin: "warning" as const,
  user: "primary" as const,
  tester: "info" as const,
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  user: "User",
  tester: "Tester",
};

export default function UsersClient({
  organization,
  users: initialUsers,
  currentUserRole, 
  currentUserEmail,
  organizationSlug,
}: UsersClientProps) {
  const [users, setUsers] = React.useState<UserData[]>(initialUsers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [addUserModalOpen, setAddUserModalOpen] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = React.useState(false);
  const [userToRemove, setUserToRemove] = React.useState<UserData | null>(null);
  const [isRemovingUser, setIsRemovingUser] = React.useState(false);
  const [updatingUserRole, setUpdatingUserRole] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof UserData>("displayName");
  const router = useRouter();

  // Comparator functions for sorting
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key
  ): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string }
  ) => number {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof UserData
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const createSortHandler = (property: keyof UserData) => (
    event: React.MouseEvent<unknown>
  ) => {
    handleRequestSort(event, property);
  };

  // Filter and sort users based on search term and sort order
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = users.filter(
        user =>
          user.email.toLowerCase().includes(term) ||
          user.displayName?.toLowerCase().includes(term) ||
          roleLabels[user.role as keyof typeof roleLabels]?.toLowerCase().includes(term)
      );
    }

    return [...filtered].sort(getComparator(order, orderBy));
  }, [users, searchTerm, order, orderBy]);

  const handleAddUserClick = () => {
    setAddUserModalOpen(true);
    setSuccess("");
  };

  const handleUserAdded = (user: any) => {
    setUsers(prev => [...prev, user]);
    setSuccess(`User ${user.email} has been added successfully`);
  };

  const handleInviteSent = (email: string) => {
    setSuccess(`Invitation sent to ${email}`);
  };

  const handleRemoveUserClick = (user: UserData) => {
    setUserToRemove(user);
    setRemoveUserDialogOpen(true);
    setSuccess("");
    setError("");
  };

  const handleRemoveUserCancel = () => {
    setRemoveUserDialogOpen(false);
    setUserToRemove(null);
  };

  const handleRemoveUserConfirm = async () => {
    if (!userToRemove) return;

    setIsRemovingUser(true);
    setError("");

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/users`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userToRemove.email,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.email !== userToRemove.email));
        setSuccess(`User ${userToRemove.email} has been removed from the organization`);
        setRemoveUserDialogOpen(false);
        setUserToRemove(null);
      } else {
        setError(data.message || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      setError("An error occurred while removing the user");
    } finally {
      setIsRemovingUser(false);
    }
  };

  const handleRoleChange = async (userEmail: string, newRole: string) => {
    setUpdatingUserRole(userEmail);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/users`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsers(prev => prev.map(user =>
          user.email === userEmail
            ? { ...user, role: newRole }
            : user
        ));
        setSuccess(`User role updated successfully`);
      } else {
        setError(data.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("An error occurred while updating the user role");
    } finally {
      setUpdatingUserRole(null);
    }
  };

  const getAvailableRoles = (userRole: string) => {
    const allRoles = ["user", "tester", "admin"];
    if (currentUserRole === "owner") {
      allRoles.push("owner");
    }
    return allRoles;
  };

  const canEditRole = (user: UserData) => {
    // Only owners and admins can edit roles
    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
      return false;
    }

    // Cannot edit owner roles unless you're an owner
    if (user.role === "owner") {
      return false;
    }

    // Cannot edit yourself
    if (user.email === currentUserEmail) {
      return false;
    }

      return true;
  };

  const getRoleChip = (role: string) => {
    return (
      <Chip
        label={roleLabels[role as keyof typeof roleLabels] || role}
        color={roleColors[role as keyof typeof roleColors] || "default"}
        size="small"
        variant="outlined"
      />
    );
  };

  const getInitials = (displayName?: string, email?: string) => {
    if (displayName) {
      return displayName.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 0 }}>
        <CardContent sx={{ p: 0 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 2 },
            }}
          >
            <Typography
              sx={{ flex: "1 1 100%" }}
              variant="h6"
              id="tableTitle"
              component="h1"
            >
              {organization.name} Users
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddUserClick}
              sx={{ borderRadius: "25px", width: "200px" }}
              size="large"
            >
              Add User
            </Button>
          </Toolbar>

          {success && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert severity="success">{success}</Alert>
            </Box>
          )}

          {error && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <Box sx={{ pt: 0 }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                autoComplete="off"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {filteredAndSortedUsers.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 3,
                }}
              >
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  {searchTerm ? "No users found" : "No users yet"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? "Try adjusting your search terms" : "Add users to get started"}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddUserClick}
                  >
                    Add User
                  </Button>
                )}
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? "right" : "left"}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : "asc"}
                          onClick={createSortHandler(headCell.id)}
                        >
                          {headCell.label}
                          {orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === "desc" ? "sorted descending" : "sorted ascending"}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={user.profileImageURL}
                            sx={{ width: 40, height: 40 }}
                          >
                            {getInitials(user.displayName, user.email)}
                          </Avatar>
                          <Typography variant="body1" fontWeight="medium">
                            {user.displayName || 'No name'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {canEditRole(user) ? (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.email, e.target.value)}
                              disabled={updatingUserRole === user.email}
                              variant="outlined"
                              sx={{
                                fontSize: '0.875rem',
                                '& .MuiSelect-select': {
                                  paddingY: '4px',
                                }
                              }}
                            >
                              {getAvailableRoles(user.role).map((role) => (
                                <MenuItem key={role} value={role}>
                                  {roleLabels[role as keyof typeof roleLabels]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          getRoleChip(user.role)
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {(currentUserRole === "owner" || currentUserRole === "admin") && user.role !== "owner" ? (
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveUserClick(user)}
                            disabled={isRemovingUser}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </CardContent>
      </Card>

      <AddUserModal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
        onInviteSent={handleInviteSent}
        organization={organization}
        currentUserRole={currentUserRole}
        organizationSlug={organizationSlug}
      />

      {/* Remove User Confirmation Dialog */}
      <Dialog
        open={removeUserDialogOpen}
        onClose={handleRemoveUserCancel}
        aria-labelledby="remove-user-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="remove-user-dialog-title">
          Remove User from Organization
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to remove <strong>{userToRemove?.displayName || userToRemove?.email}</strong> from the organization <strong>{organization.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action will revoke their access to all projects and data within this organization. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveUserCancel} disabled={isRemovingUser}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveUserConfirm}
            color="error"
            variant="contained"
            disabled={isRemovingUser}
            startIcon={isRemovingUser ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isRemovingUser ? "Removing..." : "Remove User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}