"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Plane, 
  Building2, 
  MapPin,
  Users,
  Star,
  AlertCircle,
  MessageSquare,
  Search,
  Filter
} from "lucide-react";
import styles from "../../Dashboard.module.css";

// Mock Data
const LOCATIONS_DATA = [
  {
    id: "abuja",
    name: "Abuja International Airport",
    terminals: [
      {
        id: "abv-t1",
        name: "Terminal 1",
        zones: [
          { id: "abv-t1-g1", name: "Departure Gate A", interactions: 120, satisfaction: 4.8, issues: 2, topComplaint: "Seating", status: "green" },
          { id: "abv-t1-l1", name: "VIP Lounge", interactions: 45, satisfaction: 4.9, issues: 0, topComplaint: "None", status: "green" },
          { id: "abv-t1-r1", name: "Restroom - East Wing", interactions: 230, satisfaction: 3.2, issues: 8, topComplaint: "Cleanliness", status: "red" },
        ]
      },
      {
        id: "abv-t2",
        name: "Terminal 2",
        zones: [
          { id: "abv-t2-s1", name: "Security Area", interactions: 500, satisfaction: 4.1, issues: 5, topComplaint: "Wait Time", status: "yellow" },
        ]
      }
    ]
  },
  {
    id: "lagos",
    name: "Lagos Murtala Muhammed",
    terminals: [
      {
        id: "los-intl",
        name: "International Terminal",
        zones: [
          { id: "los-intl-g1", name: "Gate 1", interactions: 300, satisfaction: 4.5, issues: 3, topComplaint: "Staff", status: "green" },
          { id: "los-intl-b1", name: "Baggage Area", interactions: 600, satisfaction: 3.8, issues: 12, topComplaint: "Baggage Delay", status: "yellow" },
        ]
      }
    ]
  }
];

export default function LocationsPage() {
  const [expanded, setExpanded] = useState<string[]>(["abuja", "abv-t1"]);
  const [selectedZone, setSelectedZone] = useState(LOCATIONS_DATA[0].terminals[0].zones[0]);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleTooltip = (id: number) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  return (
    <div className={styles.locationsLayout} onClick={() => setActiveTooltip(null)}>
      {/* LEFT PANEL - TREE VIEW */}
      <aside className={styles.treePanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Locations Tree</h3>
          <div className={styles.panelSearch}>
            <Search size={16} />
            <input type="text" placeholder="Search locations..." />
          </div>
        </div>

        <div className={styles.treeView}>
          {LOCATIONS_DATA.map((airport) => (
            <div key={airport.id} className={styles.treeItem}>
              <div 
                className={styles.treeHeader} 
                onClick={() => toggleExpand(airport.id)}
              >
                {expanded.includes(airport.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <Plane size={18} className={styles.airportIcon} />
                <span>{airport.name}</span>
              </div>

              {expanded.includes(airport.id) && (
                <div className={styles.treeSubItems}>
                  {airport.terminals.map((terminal) => (
                    <div key={terminal.id} className={styles.treeItem}>
                      <div 
                        className={styles.treeHeader}
                        onClick={() => toggleExpand(terminal.id)}
                      >
                        {expanded.includes(terminal.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Building2 size={16} className={styles.terminalIcon} />
                        <span>{terminal.name}</span>
                      </div>

                      {expanded.includes(terminal.id) && (
                        <div className={styles.treeSubItems}>
                          {terminal.zones.map((zone) => (
                            <div 
                              key={zone.id} 
                              className={`${styles.treeHeader} ${styles.zoneItem} ${selectedZone.id === zone.id ? styles.selected : ""}`}
                              onClick={() => setSelectedZone(zone)}
                            >
                              <MapPin size={14} className={styles.zoneIcon} />
                              <span>{zone.name}</span>
                              <div className={`${styles.statusDot} ${styles[zone.status]}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className={styles.locationMain} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mainHeader}>
          <div>
            <h2 className={styles.locationTitle}>{selectedZone.name}</h2>
            <p className={styles.locationPath}>FAA System / Locations / {selectedZone.name}</p>
          </div>
          <button className={styles.exportButton}>
            <Filter size={18} />
            <span>Filter Data</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Interactions</span>
              <h3 className={styles.statValue}>{selectedZone.interactions}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#fef9c3", color: "#a16207" }}>
              <Star size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Satisfaction Score</span>
              <h3 className={styles.statValue}>{selectedZone.satisfaction}/5.0</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
              <AlertCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Open Issues</span>
              <h3 className={styles.statValue}>{selectedZone.issues}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#dbeafe", color: "#1e40af" }}>
              <MessageSquare size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Top Complaint</span>
              <h3 className={styles.statValue}>{selectedZone.topComplaint}</h3>
            </div>
          </div>
        </div>

        {/* HEATMAP / VISUALIZATION */}
        <section className={styles.heatmapSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Zone Status Heatmap</h3>
              <p className={styles.sectionSubtitle}>Detailed health overview of all operational zones.</p>
            </div>
            <div className={styles.legend}>
              <div className={styles.legendItem}><span className={styles.green} /> Good</div>
              <div className={styles.legendItem}><span className={styles.yellow} /> Warning</div>
              <div className={styles.legendItem}><span className={styles.red} /> Critical</div>
            </div>
          </div>
          
          <div className={styles.heatmapGrid}>
            {[
              { id: 1, label: "Cleaning Level", value: 94, status: "green", desc: "Maintenance staff actively present. No pending tasks." },
              { id: 2, label: "Staff Presence", value: 88, status: "green", desc: "Full team rotation on-site. Average response time: 4m." },
              { id: 3, label: "Equipment Health", value: 42, status: "red", desc: "Elevator B-14 reported offline. Service technician dispatched." },
              { id: 4, label: "Wait Time", value: 65, status: "yellow", desc: "Higher than average peak. 12m wait time currently." },
              { id: 5, label: "Complaint Rate", value: 12, status: "green", desc: "Negligible complaint volume in the last 2 hours." },
              { id: 6, label: "Passenger Flow", value: 92, status: "green", desc: "Smooth transitions. No congestion reported." },
              { id: 7, label: "Security Status", value: 35, status: "red", desc: "Screening point 4 jammed. Redirecting passengers." },
              { id: 8, label: "Lighting", value: 98, status: "green", desc: "Optimal illumination level. No fixtures require repair." },
              { id: 9, label: "Feedback Loop", value: 75, status: "yellow", desc: "Interaction rate falling. Check engagement kiosks." },
              { id: 10, label: "HVAC System", value: 91, status: "green", desc: "Ambient temperature at 22.5°C. System performing well." },
              { id: 11, label: "Internet Access", value: 68, status: "yellow", desc: "Minor interference in Gate 12 area. IT investigating." },
              { id: 12, label: "Power Supply", value: 100, status: "green", desc: "Consistent power flow. Backup generators on standby." }
            ].map((block) => (
              <div 
                key={block.id} 
                className={`${styles.heatmapBlock} ${styles[block.status]} ${activeTooltip === block.id ? styles.activeBlock : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTooltip(block.id);
                }}
              >
                <div className={styles.blockContent}>
                  <span className={styles.blockLabel}>{block.label}</span>
                  <span className={styles.blockValue}>{block.value}%</span>
                </div>
                {/* Tooltip */}
                <div className={`${styles.heatmapTooltip} ${activeTooltip === block.id ? styles.activeTooltip : ""}`}>
                  <h4 className={styles.tooltipTitle}>{block.label}</h4>
                  <p className={styles.tooltipDesc}>{block.desc}</p>
                  <div className={styles.tooltipStatus}>
                    <div className={`${styles.statusBadge} ${styles[block.status]}`}>
                      Status: {block.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
