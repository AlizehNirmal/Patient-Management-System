import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import { Page, Card, Loading, ErrorMsg, btnCls, btnLightCls } from '../../components/UI';

export default function HealthCard() {
  const { data: p, loading, error, reload } = useFetch('/patients/me');
  const [toggleError, setToggleError] = useState('');

  if (loading) return <Page><Loading /></Page>;
  if (!p) return <Page><ErrorMsg>{error}</ErrorMsg></Page>;

  // The QR opens the public emergency page for this patient
  const qrValue = `${window.location.origin}/emergency/${p.qrToken}`;

  async function toggleEmergency() {
    setToggleError('');
    try {
      await api.patch('/patients/me/emergency-card', { enabled: !p.emergencyCardEnabled });
      reload();
    } catch (err) {
      setToggleError(getError(err));
    }
  }

  function download() {
    const canvas = document.getElementById('health-qr');
    const link = document.createElement('a');
    link.download = `${p.healthId}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <Page title="My health card">
      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <QRCodeCanvas id="health-qr" value={qrValue} size={180} marginSize={2} />
          <div className="space-y-1">
            <p className="text-xl font-semibold text-slate-900">{p.fullName}</p>
            <p className="text-3xl font-bold tracking-wide text-teal-700">{p.healthId}</p>
            <p className="text-slate-600">Blood group: {p.bloodGroup || 'not set'}</p>
            <p className="pt-2 text-sm text-slate-500">
              Give your Health ID to a doctor so they can request access.
            </p>
            <button className={`${btnLightCls} mt-2`} onClick={download}>Download QR</button>
          </div>
        </div>
      </Card>

      <Card title="Emergency card">
        <p className="mb-3 text-sm text-slate-600">
          When on, anyone who scans your QR code sees only your name, blood group, allergies and
          emergency contact. No login is needed.
        </p>
        <ErrorMsg>{toggleError}</ErrorMsg>
        <button className={btnCls} onClick={toggleEmergency}>
          {p.emergencyCardEnabled ? 'Turn off emergency card' : 'Turn on emergency card'}
        </button>
        <p className="mt-2 text-sm text-slate-500">
          Currently {p.emergencyCardEnabled ? 'on' : 'off'}.
        </p>
      </Card>
    </Page>
  );
}
