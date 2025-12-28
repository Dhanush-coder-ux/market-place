import { getDashboardDataByMonth } from "@/utils/dashboard";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Category,
  Tooltip,
  DataLabel,
  Legend,
  ColumnSeries,
  SplineAreaSeries,
} from "@syncfusion/ej2-react-charts";
import { MonthKey } from "../types";





const RevenueChart: React.FC<{setChartMonth:React.Dispatch<React.SetStateAction<MonthKey>>}>= ({setChartMonth}) => {
  const getSafeData = (month:any) => {
    const data = getDashboardDataByMonth(month);

    return data?.revenue || { cur: 0, last: 0 };
  };

  const data = [
    { month: "Jan", target: getSafeData("dec").last, revenue: getSafeData("jan").cur },
    { month: "Feb", target: getSafeData("jan").last, revenue: getSafeData("feb").cur },
    { month: "Mar", target: getSafeData("feb").last, revenue: getSafeData("mar").cur },
    { month: "Apr", target: getSafeData("mar").last, revenue: getSafeData("apr").cur },
    { month: "May", target: getSafeData("apr").last, revenue: getSafeData("may").cur },
    { month: "Jun", target: getSafeData("may").last, revenue: getSafeData("jun").cur },
    { month: "Jul", target: getSafeData("jun").last, revenue: getSafeData("jul").cur },
    { month: "Aug", target: getSafeData("jul").last, revenue: getSafeData("aug").cur },
    { month: "Sep", target: getSafeData("aug").last, revenue: getSafeData("sep").cur },
    { month: "Oct", target: getSafeData("sep").last, revenue: getSafeData("oct").cur },
    { month: "Nov", target: getSafeData("oct").last, revenue: getSafeData("nov").cur },
    { month: "Dec", target: getSafeData("nov").last, revenue: getSafeData("dec").cur },
  ];

const maxValue = Math.max(...data.map(d => d.revenue), ...data.map(d => d.target));
console.log("maxvalue",maxValue);


const roundedMax = Math.ceil(maxValue / 1000) * 1000;

const handleBarClick = (month:any) => {

    if (setChartMonth) {
        setChartMonth(month.toLowerCase());
    }
  };
  

  return (
<ChartComponent
      pointClick={(args) => {
  const month = args.point.x;
  handleBarClick(month);
}}
        id="revenue-chart"
        height="400px"
        primaryXAxis={{
          valueType: "Category",
          majorGridLines: { width: 0 },
          majorTickLines: { width: 0 },
          labelStyle: { color: "#6b7280", fontWeight: 600 },
          axisLine: { width: 0 },
          interval: 1,
        }}
        primaryYAxis={{
          minimum: 0,
          maximum: roundedMax,
          interval: roundedMax/4,
          labelFormat: "₹{value}k",
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          labelStyle: { color: "#9ca3af", fontWeight: 500 },
          majorGridLines: { color: "#f3f4f6", dashArray: "4,4" },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{
          enable: true,
          shared: true,
          header: "<b>${point.x} Revenue</b>",
          format: "${series.name}: <b>${point.y}</b>",
          fill: "#111827",
          textStyle: { color: "#ffffff" },
        }}
        legendSettings={{ visible: true, position: "Top", alignment: "Far" }}
      >
        <Inject
          services={[
            ColumnSeries,
            SplineAreaSeries,
            Category,
            DataLabel,
            Tooltip,
            Legend,
          ]}
        />

        <SeriesCollectionDirective>

          <SeriesDirective
            type="SplineArea"
            dataSource={data}
            xName="month"
            yName="target"
            name="Last Month"
            opacity={0.15}
            fill="#4F46E5"
            border={{ width: 2, color: "#4F46E5" }}
          
            
          />

       
          <SeriesDirective
            type="Column"
            dataSource={data}
            xName="month"
            yName="revenue"
            name="Current Month"
            columnWidth={0.45}
            cornerRadius={{ topLeft: 6, topRight: 6 }}
            fill="#4F46E5"
          
          />
 

        </SeriesCollectionDirective>
      </ChartComponent>
  );
};

export default RevenueChart;
