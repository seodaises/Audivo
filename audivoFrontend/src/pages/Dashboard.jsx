import { Box, Typography, Chip, Stack, Paper, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../auth/permissions';

export default function Dashboard() {
  const { user, can } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Welcome, {user.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Signed in as <strong>{user.role}</strong> (level {user.level}).
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Your permissions</Typography>
        {user.permissions.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {user.permissions.map((p) => <Chip key={p} label={p} color="primary" variant="outlined" />)}
          </Stack>
        ) : (
          <Alert severity="info">base listening only.</Alert>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Actions (gated by permission)</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {can(PERMISSIONS.UPLOAD_SONGS) && <Button variant="contained" disableElevation>Upload a song</Button>}
          {can(PERMISSIONS.DELETE_SONGS) && <Button color="error" variant="outlined">Delete a song</Button>}
          {can(PERMISSIONS.MANAGE_USERS) && <Button variant="outlined">Manage users</Button>}
          {can(PERMISSIONS.MANAGE_ROLES) && <Button variant="outlined">Manage roles</Button>}
          {!user.permissions.length && <Typography color="text.secondary">No actions available for this role.</Typography>}
        </Stack>
      </Paper>
    </Box>
  );
}