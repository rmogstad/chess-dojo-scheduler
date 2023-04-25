import { AppBar, Container, Toolbar } from '@mui/material';

import { useEvents } from '../api/cache/Cache';
import { useAuth } from '../auth/Auth';
import { Event } from '../database/event';
import NavbarMenu from './NavbarMenu';
import { AvailabilityStatus } from '../database/availability';

const ONE_HOUR = 3600000;

const Navbar = () => {
    const auth = useAuth();

    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();
    const { events } = useEvents();

    const count = events.filter((e: Event) => {
        if (e.participants.length === 0) {
            return false;
        }
        if (
            e.owner !== auth.user?.username &&
            e.participants.every((p) => p.username !== auth.user?.username)
        ) {
            return false;
        }
        return e.status !== AvailabilityStatus.Canceled && e.endTime >= filterTime;
    }).length;

    const meetingText = count > 0 ? `Meetings (${count})` : `Meetings`;

    return (
        <AppBar position='sticky' sx={{ zIndex: 1300 }}>
            <Container maxWidth='xl'>
                <Toolbar disableGutters>
                    <NavbarMenu meetingText={meetingText} />
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
