import React, { useMemo, useState, useEffect } from 'react';
import QRCode from 'qrcode';

import CrewmateScreen from './crewmateScreen';
import ImposterScreen from './imposterScreen';

import { upperFirstCharOnly } from 'utils';

const qrOpts = {
  errorCorrectionLevel: 'H',
  version: 3,
  scale: 6
};

// TODO: add more mobile tasks
//          oo maybe just do wiring1, wiring2, wiring3 type thing (silly but eh)

export default function GameScreen(props) {
  // console.log(props);
  const { players, username, hostname, myPlayer } = props;
  const { role, tasks } = myPlayer;
  // TODO: ^^ add params for sending qrscan result to server (asking for task completion)
  const [qrCodeDataURL, setQrCodeDataURL] = useState();

  // const myPlayer = useMemo(() => players[username], [players, username]);
  const isCrewmate = useMemo(() => role === "CREWMATE", [role]);
  const isImposter = useMemo(() => role === "IMPOSTER", [role]);

  useEffect(() => {
    (async () => {
      try {
        const qrDataURL = await QRCode.toDataURL(username, qrOpts);
        setQrCodeDataURL(qrDataURL);
      } catch (error) {
        console.error(error);
      } finally {}
    })();
  }, [username]);

  return (
    <>
      { isCrewmate && <CrewmateScreen { ...props } /> }
      { isImposter && <ImposterScreen { ...props } /> }
    </>
    );
}
