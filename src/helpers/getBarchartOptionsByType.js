import { get } from 'lodash-es';

export default function getBarchartOptionsByType(type) {
  const defaultOptions = {
    legend: { display: false },
    maintainAspectRatio: false,
    responsive: true,
    onHover: (event, chartElement) => {
      event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
  };
  const options = {
    revenue: {
      ...defaultOptions,
      borderRadius: 0.3,
      scales: {
        yAxes: [{
          position: 'right',
          ticks: {
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 50,
          },
          gridLines: {
            color: '#e3e5e6',
            borderDash: [5, 2],
            zeroLineColor: '#919699',
          },
        }],
        xAxes: [{
          type: 'time',
          time: {
            unit: 'week',
            displayFormats: { week: 'D MMM' },
            round: true,
          },
          ticks: { padding: 4 },
          gridLines: { drawOnChartArea: false },
          categoryPercentage: 1,
          maxBarThickness: 22,
        }],
      },
      layout: {
        padding: {
          top: 40,
        },
      },
      tooltips: {
        backgroundColor: '#000',
        displayColors: false,
        mode: 'point',
        xPadding: 22,
        yPadding: 8,
        yAlign: 'bottom',
        xAlign: 'center',
        callbacks: {
          title: () => '',
        },
      },
    },
    common: {
      ...defaultOptions,
      borderRadius: 0.8,
      scales: {
        yAxes: [{
          display: false,
          ticks: { beginAtZero: true },
          gridLines: { display: false },
        }],
        xAxes: [{
          ticks: { padding: 2 },
          display: false,
          type: 'time',
          time: {
            min: 1567218400000,
            max: 1569812600000,
          },
          gridLines: { display: false },
          categoryPercentage: 1,
          maxBarThickness: 6,
        }],
      },
      layout: {
        padding: {
          top: 18,
        },
      },
      tooltips: {
        backgroundColor: '#000',
        displayColors: false,
        mode: 'point',
        xPadding: 22,
        yPadding: 8,
        callbacks: {
          title: () => '',
        },
      },
    },
    basePaymentLink: {
      ...defaultOptions,
      borderRadius: 0,
      scales: {
        yAxes: [{
          display: false,
          ticks: { beginAtZero: true },
          gridLines: { display: false },
        }],
        xAxes: [{
          ticks: { padding: 0 },
          display: false,
          type: 'time',
          time: {
            min: 1567218400000,
            max: 1569812600000,
          },
          gridLines: { display: false },
          categoryPercentage: 1,
          maxBarThickness: 6,
        }],
      },
      layout: {
        padding: {
          top: 0,
        },
      },
      tooltips: {
        backgroundColor: '#000',
        displayColors: true,
        mode: 'point',
        xPadding: 22,
        yPadding: 8,
        callbacks: {
          title: () => '',
        },
      },
    },
    summary: {
      ...defaultOptions,
      borderRadius: 0.3,
      scales: {
        yAxes: [{
          position: 'right',
          ticks: {
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 50,
          },
          gridLines: {
            color: '#e3e5e6',
            borderDash: [5, 2],
            zeroLineColor: '#919699',
          },
        }],
        xAxes: [{
          type: 'time',
          time: {
            unit: 'week',
            displayFormats: { week: 'D MMM' },
            round: true,
          },
          ticks: { padding: 4 },
          gridLines: { drawOnChartArea: false },
          categoryPercentage: 1,
          maxBarThickness: 22,
        }],
      },
      layout: {
        padding: {
          top: 40,
        },
      },
      tooltips: {
        backgroundColor: '#000',
        displayColors: false,
        mode: 'point',
        xPadding: 22,
        yPadding: 8,
        yAlign: 'bottom',
        xAlign: 'center',
        callbacks: {
          title: () => '',
        },
      },
    },
  };

  return get(options, type, options.common);
}
