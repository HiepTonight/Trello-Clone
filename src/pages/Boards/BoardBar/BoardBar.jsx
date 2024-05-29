import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import AddToDriveIcon from '@mui/icons-material/AddToDrive'
import BoltIcon from '@mui/icons-material/Bolt'
import FilterListIcon from '@mui/icons-material/FilterList'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import { Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { capitalizeFirstLetter } from '~/utils/formatter'

const MENU_STYLES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': { color: 'white' },
  '&:hover': { bgcolor: 'primary.50' }
}

function BoardBar({ board }) {
  return (
    <Box px={2} sx={{
      width: '100%',
      height: (theme) => theme.trello.boardBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      overflowX: 'auto',
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2')
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title = {board?.description} >
          <Chip
            sx={MENU_STYLES}
            icon={<DashboardIcon />} label={ board?.title }
            clickable
          />
        </Tooltip>

        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockIcon />} label={ capitalizeFirstLetter(board?.type) }
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<AddToDriveIcon />} label="Add To Google Drive"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<BoltIcon />} label="Automation"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<FilterListIcon />} label="Filter"
          clickable
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': { borderColor: 'white' }
          }}
        >
          Invite
        </Button>
        <AvatarGroup max={7} sx={{ gap: '8px', '& .MuiAvatar-root': { width: 34, height: 34, fontSize: 16, border: 'none', color: 'white', cursor: 'pointer', '&:first-of-type': { bgcolor: '#a4b0de' } } }}>
          <Tooltip title="Hiep Tran">
            <Avatar alt="Hiep Tran" src="https://images.unsplash.com/photo-1710743385031-c281b779d125?q=80&w=1886&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </Tooltip>
          <Tooltip title="Hiep Tran">
            <Avatar alt="Hiep Tran" src="https://plus.unsplash.com/premium_photo-1709311451252-fbe6d75e3cc5?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </Tooltip>
          <Tooltip title="Hiep Tran">
            <Avatar alt="Hiep Tran" src="https://images.unsplash.com/photo-1710172510134-b77b8fb44ea2?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </Tooltip>
        </AvatarGroup>
      </Box>
    </Box>
  )
}

export default BoardBar