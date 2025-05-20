'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import styles from './ResultsChart.module.css';

export default function ResultsChart({ results }) {
  const chartRefs = useRef({});

  useEffect(() => {
    // Destroy existing charts
    Object.values(chartRefs.current).forEach(chart => chart.destroy());
    chartRefs.current = {};

    // Create new charts for each position
    Object.entries(results).forEach(([position, candidates]) => {
      const ctx = document.getElementById(`chart-${position}`);
      if (!ctx) return;

      const data = {
        labels: Object.keys(candidates),
        datasets: [{
          data: Object.values(candidates),
          backgroundColor: [
            '#1d4e89',
            '#f7c242',
            '#28a745',
            '#dc3545',
            '#17a2b8',
            '#ffc107'
          ]
        }]
      };

      chartRefs.current[position] = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: position,
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    });

    // Cleanup function
    return () => {
      Object.values(chartRefs.current).forEach(chart => chart.destroy());
    };
  }, [results]);

  return (
    <div className={styles.chartsContainer}>
      {Object.keys(results).map(position => (
        <div key={position} className={styles.chartWrapper}>
          <canvas id={`chart-${position}`}></canvas>
        </div>
      ))}
    </div>
  );
}