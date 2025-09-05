"use client";

import * as React from "react";
import {
  Box,
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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import AddUserModal from "./AddUserModal";

interface UserData {
  email: string;
  displayName: string;
  profileImageURL?: string;
  role: string;
}

interface OrganizationData {
  slug: string;
  name: string;
  domain: string;
}

interface UsersClientProps {
  organization: OrganizationData;
  users: UserData[];
  currentUserRole: string;
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
  organizationSlug,
}: UsersClientProps) {
  const [users, setUsers] = React.useState<UserData[]>(initialUsers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [addUserModalOpen, setAddUserModalOpen] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const router = useRouter();

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(
      user =>
        user.email.toLowerCase().includes(term) ||
        user.displayName?.toLowerCase().includes(term) ||
        roleLabels[user.role as keyof typeof roleLabels]?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

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

            {filteredUsers.length === 0 ? (
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
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
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
                        {getRoleChip(user.role)}
                      </TableCell>
                      <TableCell align="right">
                        {/* TODO: Add edit/remove actions for owners */}
                        <Typography variant="body2" color="text.secondary">
                          {currentUserRole === "owner" ? "Manage" : "—"}
                        </Typography>
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
    </Box>
  );
}