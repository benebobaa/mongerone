'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IncomeExpenseChart } from '@/components/reports/income-expense-chart';
import { CategoryPieChart } from '@/components/reports/category-pie-chart';
import { TrendsChart } from '@/components/reports/trends-chart';
import { ExportButton } from '@/components/reports/export-button';
import { CalendarIcon } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getIncomeExpenseReport,
  getCategoryBreakdown,
  getBalanceTrend,
  type MonthlyData,
  type CategoryBreakdown,
  type TrendData,
} from '@/lib/actions/reports';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const [incomeExpenseData, setIncomeExpenseData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [incomeExpenseResult, categoryResult, trendResult] = await Promise.all([
        getIncomeExpenseReport(startDate, endDate),
        getCategoryBreakdown(startDate, endDate, 'expense'),
        getBalanceTrend(startDate, endDate),
      ]);

      if (incomeExpenseResult.success) {
        setIncomeExpenseData(incomeExpenseResult.data);
      }

      if (categoryResult.success) {
        setCategoryData(categoryResult.data);
      }

      if (trendResult.success) {
        setTrendData(trendResult.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Visualize your financial data and track your progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          <ExportButton startDate={startDate} endDate={endDate} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expense</CardTitle>
              <CardDescription>
                Monthly comparison of your income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={incomeExpenseData} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeExpenseData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Income</span>
                      <span className="text-lg font-semibold text-green-600">
                        $
                        {incomeExpenseData
                          .reduce((sum, item) => sum + item.income, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Expenses</span>
                      <span className="text-lg font-semibold text-red-600">
                        $
                        {incomeExpenseData
                          .reduce((sum, item) => sum + item.expense, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm font-medium">Net Savings</span>
                      <span className="text-lg font-bold">
                        $
                        {incomeExpenseData
                          .reduce((sum, item) => sum + (item.income - item.expense), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="space-y-4">
                    {categoryData.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </span>
                          <span className="text-sm font-medium">
                            ${category.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
              <CardDescription>
                See how your spending is distributed across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={categoryData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}% of total
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${category.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Over Time</CardTitle>
              <CardDescription>
                Track how your total balance changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendsChart data={trendData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
