'use client';

import { Fragment, useState } from 'react';
import styles from './GlobalNetwork.module.css';
import type { Dict } from '@/i18n/get-dictionary';

interface Props {
  dict: Dict['global'];
}

// Map coordinates are geographic and stay LTR even on RTL pages.
// Hub IDs are stable; localized names + roles come from the dictionary.
const HUB_COORDINATES = [
  { id: 'seoul',    top: '35%',   left: '84%' },
  { id: 'shenzhen', top: '44%',   left: '80%' },
  { id: 'hongkong', top: '45.5%', left: '80.5%' },
  { id: 'dubai',    top: '42.5%', left: '65.5%' },
  { id: 'uzbek',    top: '30%',   left: '69%' },
] as const;

type HubId = (typeof HUB_COORDINATES)[number]['id'];

export default function GlobalNetwork({ dict }: Props) {
  const [activeHub, setActiveHub] = useState<HubId>('seoul');

  return (
    <section id="global" className={`section-padding ${styles.globalSection}`}>
      <div className="container">
        <div className={styles.globalGrid}>
          <div className={styles.globalText}>
            <span className="section-badge">{dict.badge}</span>
            <h2 className="section-title" style={{ color: 'var(--color-white)' }}>
              {dict.titleLines.map((line, i) => (
                <Fragment key={i}>
                  {line}
                  {i < dict.titleLines.length - 1 && <br />}
                </Fragment>
              ))}
            </h2>
            <p
              className="section-desc"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}
            >
              {dict.desc}
            </p>

            <ul className={styles.hubList}>
              {HUB_COORDINATES.map((hub) => {
                const data = dict.hubs[hub.id];
                return (
                  <li
                    key={hub.id}
                    className={`${styles.hubItem} ${activeHub === hub.id ? styles.active : ''}`}
                    onMouseEnter={() => setActiveHub(hub.id)}
                  >
                    <span className={styles.hubDot}></span>
                    <div className={styles.hubInfo}>
                      <h4 className={styles.hubName}>{data.name}</h4>
                      <p className={styles.hubRole}>{data.role}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Map is geographic — stays LTR even on RTL pages (see .module.css) */}
          <div className={styles.mapContainer}>
            <div className={styles.mapVisual}>
              <div className={styles.mapMask}></div>

              {HUB_COORDINATES.map((hub) => (
                <div
                  key={`pin-${hub.id}`}
                  className={`${styles.mapPin} ${activeHub === hub.id ? styles.activePin : ''}`}
                  style={{ top: hub.top, left: hub.left }}
                  onMouseEnter={() => setActiveHub(hub.id)}
                >
                  <div className={styles.pinPulse}></div>
                  <span className={styles.pinLabel}>{dict.hubs[hub.id].shortLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
