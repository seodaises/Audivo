import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USERS, ROLES, ANALYTICS } from '../constants/route_constant';

import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

// A single metric tile. Value is a placeholder ("—") until the metrics
// endpoints exist — the layout is ready, so wiring real numbers later is trivial.
function StatCard({ icon, label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 200px', minWidth: 200, p: 2.5, borderRadius: 3,
        border: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48, height: 48, borderRadius: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'primary.main', color: 'primary.contrastText',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      </Box>
    </Paper>
  );
}

// A clickable tile that routes somewhere in the admin area.
function ActionCard({ icon, title, description, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        flex: '1 1 240px', minWidth: 240, p: 2.5, borderRadius: 3, cursor: 'pointer',
        border: '1px solid', borderColor: 'divider',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: 'primary.main' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5, color: 'primary.main' }}>
        <Typography variant="button">Open</Typography>
        <ArrowForwardRoundedIcon fontSize="small" />
      </Stack>
    </Paper>
  );
}

export default function AdminDashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const name = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
          Admin overview
        </Typography>
        <Chip label={user?.role || 'Admin'} color="primary" size="small" sx={{ fontWeight: 700 }} />
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {name}. Here's the state of Audivo at a glance.
      </Typography>

      {/* Metrics — placeholders until the metrics endpoints land */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <StatCard icon={<PeopleRoundedIcon />} label="Total users" value="—" />
        <StatCard icon={<CheckCircleRoundedIcon />} label="Active users" value="—" />
        <StatCard icon={<LibraryMusicRoundedIcon />} label="Songs" value="—" />
        <StatCard icon={<FlagRoundedIcon />} label="Open reports" value="—" />
      </Box>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 4 }}>
        Live metrics coming soon.
      </Typography>

      {/* Quick actions — gated by the same permission keys your Sidebar uses */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick actions</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {can('manage_users') && (
          <ActionCard
            icon={<ManageAccountsRoundedIcon />}
            title="Manage users"
            description="View accounts, search users, and enable or disable access."
            onClick={() => navigate(USERS)}
          />
        )}
        {can('view_analytics') && (
          <ActionCard
            icon={<BarChartRoundedIcon />}
            title="Analytics"
            description="Track listens, growth, and engagement across Audivo."
            onClick={() => navigate(ANALYTICS)}
          />
        )}
      </Box>

      {/* Super Admin only — gated by manage_roles, which only Super Admin holds,
          so Admins never see this section. This is the Admin/Super-Admin split. */}
      {can('manage_roles') && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <AdminPanelSettingsRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Super Admin</Typography>
            <Chip label="Elevated" size="small" variant="outlined" color="primary" />
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <ActionCard
              icon={<AdminPanelSettingsRoundedIcon />}
              title="Manage roles"
              description="Assign roles and create new admin accounts."
              onClick={() => navigate(ROLES)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}