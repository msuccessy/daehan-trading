import { Fragment } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import type { Dict } from '@/i18n/get-dictionary';
import styles from './ContactInfo.module.css';

interface Props {
  dict: Dict['contact'];
}

export default function ContactInfo({ dict }: Props) {
  return (
    <section id="contact" className={`section-padding ${styles.contactSection}`}>
      <div className="container">
        <div className={styles.contactWrapper}>
          <div className={styles.contactHeader}>
            <span className="section-badge">{dict.badge}</span>
            <h2 className="section-title">
              {dict.titleLines.map((line, i) => (
                <Fragment key={i}>
                  {line}
                  {i < dict.titleLines.length - 1 && <br />}
                </Fragment>
              ))}
            </h2>
            <p className="section-desc">
              {dict.descLines.map((line, i) => (
                <Fragment key={i}>
                  {line}
                  {i < dict.descLines.length - 1 && <br />}
                </Fragment>
              ))}
            </p>
          </div>

          <div className={styles.channelRail}>
            <div className={styles.channelCard}>
              <Mail className={styles.channelIcon} size={28} aria-hidden="true" />
              <div className={styles.channelLabel}>{dict.channels.email.label}</div>
              <a
                href={`mailto:${dict.channels.email.value}`}
                className={styles.channelValue}
              >
                {dict.channels.email.value}
              </a>
            </div>

            <div className={styles.channelCard}>
              <Phone className={styles.channelIcon} size={28} aria-hidden="true" />
              <div className={styles.channelLabel}>{dict.channels.phone.label}</div>
              <a
                href={`tel:${dict.channels.phone.value.replace(/[^+0-9]/g, '')}`}
                className={styles.channelValue}
              >
                {dict.channels.phone.value}
              </a>
            </div>

            <div className={`${styles.channelCard} ${styles.channelCardWide}`}>
              <MapPin className={styles.channelIcon} size={28} aria-hidden="true" />
              <div className={styles.channelLabel}>{dict.channels.address.label}</div>
              <p className={styles.channelValue}>{dict.channels.address.value}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
