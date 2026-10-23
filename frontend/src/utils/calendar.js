const MODALITY_LABELS = {
  video: 'Chamada de voz ou vídeo',
  request_address: 'Endereço da solicitação',
  my_address: 'No endereço de quem ajuda',
  other_address: 'Outro endereço',
};

export const modalityLabel = (m) => MODALITY_LABELS[m] || m;

export const formatDate = (d) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

export const mapsUrl = (address) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

const icsStamp = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

export const downloadIcs = (appt, otherName) => {
  const where = appt.modality === 'video' ? appt.meeting_url : appt.address;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fiel de Deus//PT', 'BEGIN:VEVENT',
    `UID:${appt.id}@fieledeus`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${icsStamp(appt.date, appt.start_time)}`,
    `DTEND:${icsStamp(appt.date, appt.end_time)}`,
    `SUMMARY:Encontro com ${otherName}`,
    `DESCRIPTION:${modalityLabel(appt.modality)}${appt.notes ? ' - ' + appt.notes.replace(/\n/g, ' ') : ''}`,
    where ? `LOCATION:${where.replace(/([,;])/g, '\\$1')}` : '',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete do encontro', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'encontro.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
