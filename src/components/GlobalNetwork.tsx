'use client';

import { useState } from 'react';
import styles from './GlobalNetwork.module.css';

// Coordinates adjusted to match the real world map projection
// Map represents: X / Left (Longitude), Y / Top (Latitude)
const HUBS = [
  { id: 'seoul', name: '서울 (Seoul)', role: 'Headquarter / 글로벌 컨트롤 타워', top: '35%', left: '84%' },
  { id: 'shenzhen', name: '심천 (Shenzhen)', role: 'China Branch / 아시아 물류 허브', top: '44%', left: '80%' },
  { id: 'hongkong', name: '홍콩 (Hong Kong)', role: 'Financial & Trade Branch', top: '45.5%', left: '80.5%' },
  { id: 'dubai', name: '두바이 (Dubai)', role: 'MEA Branch / 중동·아프리카 진출 교두보', top: '42.5%', left: '65.5%' },
  { id: 'uzbek', name: '우즈베키스탄 (Uzbekistan)', role: 'CIS Branch / 중앙아시아 신규 거점', top: '30%', left: '69%' }
];

export default function GlobalNetwork() {
  const [activeHub, setActiveHub] = useState('seoul');

  return (
    <section id="global" className={`section-padding ${styles.globalSection}`}>
      <div className="container">
        <div className={styles.globalGrid}>
          <div className={styles.globalText}>
            <span className="section-badge">Worldwide Network</span>
            <h2 className="section-title" style={{ color: 'var(--color-white)' }}>
              세계를 연결하는<br />견고한 인프라
            </h2>
            <p className="section-desc" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
              한국을 넘어 아시아와 중동을 잇는 단단한 파트너십. 전 세계 주요 스마트폰 유통 거점에 대한무역이 있습니다.
            </p>
            
            <ul className={styles.hubList}>
              {HUBS.map(hub => (
                <li 
                  key={hub.id}
                  className={`${styles.hubItem} ${activeHub === hub.id ? styles.active : ''}`}
                  onMouseEnter={() => setActiveHub(hub.id)}
                >
                  <span className={styles.hubDot}></span>
                  <div className={styles.hubInfo}>
                    <h4 className={styles.hubName}>{hub.name}</h4>
                    <p className={styles.hubRole}>{hub.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className={styles.mapContainer}>
            <div className={styles.mapVisual}>
              {/* React SVG Mask for rendering the beautiful dotted world map */}
              <div className={styles.mapMask}></div>
              
              {HUBS.map(hub => (
                <div 
                  key={`pin-${hub.id}`}
                  className={`${styles.mapPin} ${activeHub === hub.id ? styles.activePin : ''}`}
                  style={{ top: hub.top, left: hub.left }}
                  onMouseEnter={() => setActiveHub(hub.id)}
                >
                  <div className={styles.pinPulse}></div>
                  <span className={styles.pinLabel}>{hub.id.charAt(0).toUpperCase() + hub.id.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
