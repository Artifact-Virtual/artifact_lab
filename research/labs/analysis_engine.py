#!/usr/bin/env python3
"""
Research Data Analysis Engine
Advanced automated research analysis with machine learning integration
Built for the Artifact Virtual Research Lab system
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple
import sqlite3
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from scipy import stats
from scipy.signal import find_peaks, periodogram
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger("research-analysis")

@dataclass
class AnalysisResult:
    """Container for analysis results"""
    analysis_id: str
    analysis_type: str
    timestamp: datetime
    confidence_score: float
    results: Dict[str, Any]
    visualizations: List[str]
    metadata: Dict[str, Any]

class StatisticalAnalysisEngine:
    """Advanced statistical analysis for research data"""
    
    def __init__(self, lab_system):
        self.lab = lab_system
        self.cache = {}
        
    async def analyze(self, data: Dict[str, Any], parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Comprehensive statistical analysis"""
        
        if parameters is None:
            parameters = {}
        
        # Extract numerical data
        numeric_data = self._extract_numeric_data(data)
        
        results = {
            "descriptive_statistics": await self._descriptive_analysis(numeric_data),
            "correlation_analysis": await self._correlation_analysis(numeric_data),
            "distribution_analysis": await self._distribution_analysis(numeric_data),
            "outlier_detection": await self._outlier_detection(numeric_data),
            "hypothesis_tests": await self._hypothesis_testing(numeric_data, parameters),
            "confidence_intervals": await self._confidence_intervals(numeric_data),
            "regression_analysis": await self._regression_analysis(numeric_data, parameters)
        }
        
        return results
    
    def _extract_numeric_data(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Extract and clean numeric data"""
        if 'dataframe' in data:
            df = pd.DataFrame(data['dataframe'])
        elif 'values' in data:
            df = pd.DataFrame({'values': data['values']})
        else:
            # Try to construct DataFrame from various data formats
            df = pd.DataFrame(data)
        
        # Keep only numeric columns
        numeric_df = df.select_dtypes(include=[np.number])
        return numeric_df
    
    async def _descriptive_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive descriptive statistics"""
        
        results = {}
        
        for column in df.columns:
            series = df[column].dropna()
            
            results[column] = {
                "count": len(series),
                "mean": float(series.mean()),
                "median": float(series.median()),
                "std": float(series.std()),
                "variance": float(series.var()),
                "min": float(series.min()),
                "max": float(series.max()),
                "range": float(series.max() - series.min()),
                "skewness": float(stats.skew(series)),
                "kurtosis": float(stats.kurtosis(series)),
                "percentiles": {
                    "25th": float(series.quantile(0.25)),
                    "50th": float(series.quantile(0.50)),
                    "75th": float(series.quantile(0.75)),
                    "90th": float(series.quantile(0.90)),
                    "95th": float(series.quantile(0.95)),
                    "99th": float(series.quantile(0.99))
                }
            }
        
        return results
    
    async def _correlation_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Correlation analysis between variables"""
        
        if df.shape[1] < 2:
            return {"message": "Need at least 2 variables for correlation analysis"}
        
        # Pearson correlation
        pearson_corr = df.corr(method='pearson')
        
        # Spearman correlation
        spearman_corr = df.corr(method='spearman')
        
        # Kendall correlation
        kendall_corr = df.corr(method='kendall')
        
        # Significant correlations (p < 0.05)
        significant_correlations = []
        for i, col1 in enumerate(df.columns):
            for j, col2 in enumerate(df.columns):
                if i < j:  # Avoid duplicates
                    corr_coef, p_value = stats.pearsonr(df[col1].dropna(), df[col2].dropna())
                    if p_value < 0.05:
                        significant_correlations.append({
                            "variable_1": col1,
                            "variable_2": col2,
                            "correlation": float(corr_coef),
                            "p_value": float(p_value),
                            "significance": "strong" if abs(corr_coef) > 0.7 else "moderate" if abs(corr_coef) > 0.3 else "weak"
                        })
        
        return {
            "pearson_correlation": pearson_corr.to_dict(),
            "spearman_correlation": spearman_corr.to_dict(),
            "kendall_correlation": kendall_corr.to_dict(),
            "significant_correlations": significant_correlations
        }
    
    async def _distribution_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze distributions of variables"""
        
        results = {}
        
        for column in df.columns:
            series = df[column].dropna()
            
            # Normality tests
            shapiro_stat, shapiro_p = stats.shapiro(series[:5000])  # Limit for performance
            ks_stat, ks_p = stats.kstest(series, 'norm', args=(series.mean(), series.std()))
            
            # Distribution fitting
            distributions = ['norm', 'gamma', 'beta', 'exponential']
            best_fit = None
            best_aic = float('inf')
            
            for dist_name in distributions:
                try:
                    dist = getattr(stats, dist_name)
                    params = dist.fit(series)
                    
                    # Calculate AIC
                    log_likelihood = np.sum(dist.logpdf(series, *params))
                    k = len(params)
                    aic = 2 * k - 2 * log_likelihood
                    
                    if aic < best_aic:
                        best_aic = aic
                        best_fit = {
                            "distribution": dist_name,
                            "parameters": params,
                            "aic": aic
                        }
                except:
                    continue
            
            results[column] = {
                "normality_tests": {
                    "shapiro_wilk": {"statistic": float(shapiro_stat), "p_value": float(shapiro_p)},
                    "kolmogorov_smirnov": {"statistic": float(ks_stat), "p_value": float(ks_p)}
                },
                "best_fit_distribution": best_fit,
                "histogram_data": {
                    "counts": np.histogram(series, bins=30)[0].tolist(),
                    "bin_edges": np.histogram(series, bins=30)[1].tolist()
                }
            }
        
        return results
    
    async def _outlier_detection(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect outliers using multiple methods"""
        
        results = {}
        
        for column in df.columns:
            series = df[column].dropna()
            
            # Z-score method
            z_scores = np.abs(stats.zscore(series))
            z_outliers = series[z_scores > 3].index.tolist()
            
            # IQR method
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            iqr_outliers = series[(series < lower_bound) | (series > upper_bound)].index.tolist()
            
            # Isolation Forest method
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            outlier_labels = iso_forest.fit_predict(series.values.reshape(-1, 1))
            iso_outliers = series[outlier_labels == -1].index.tolist()
            
            results[column] = {
                "z_score_outliers": {
                    "indices": z_outliers,
                    "count": len(z_outliers),
                    "percentage": len(z_outliers) / len(series) * 100
                },
                "iqr_outliers": {
                    "indices": iqr_outliers,
                    "count": len(iqr_outliers),
                    "percentage": len(iqr_outliers) / len(series) * 100,
                    "bounds": {"lower": float(lower_bound), "upper": float(upper_bound)}
                },
                "isolation_forest_outliers": {
                    "indices": iso_outliers,
                    "count": len(iso_outliers),
                    "percentage": len(iso_outliers) / len(series) * 100
                }
            }
        
        return results
    
    async def _hypothesis_testing(self, df: pd.DataFrame, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Perform hypothesis tests"""
        
        results = {}
        
        # One-sample t-tests for each column
        for column in df.columns:
            series = df[column].dropna()
            
            # Test if mean is significantly different from 0
            t_stat, p_value = stats.ttest_1samp(series, 0)
            
            results[f"{column}_ttest_vs_zero"] = {
                "test_type": "one_sample_t_test",
                "null_hypothesis": "mean = 0",
                "t_statistic": float(t_stat),
                "p_value": float(p_value),
                "significant": p_value < 0.05,
                "sample_mean": float(series.mean())
            }
        
        # Two-sample tests if we have multiple columns
        if df.shape[1] >= 2:
            columns = df.columns.tolist()
            for i, col1 in enumerate(columns):
                for j, col2 in enumerate(columns):
                    if i < j:
                        series1 = df[col1].dropna()
                        series2 = df[col2].dropna()
                        
                        # Independent t-test
                        t_stat, p_value = stats.ttest_ind(series1, series2)
                        
                        # Mann-Whitney U test (non-parametric)
                        u_stat, u_p_value = stats.mannwhitneyu(series1, series2, alternative='two-sided')
                        
                        results[f"{col1}_vs_{col2}"] = {
                            "independent_t_test": {
                                "t_statistic": float(t_stat),
                                "p_value": float(p_value),
                                "significant": p_value < 0.05
                            },
                            "mann_whitney_u": {
                                "u_statistic": float(u_stat),
                                "p_value": float(u_p_value),
                                "significant": u_p_value < 0.05
                            }
                        }
        
        return results
    
    async def _confidence_intervals(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate confidence intervals"""
        
        results = {}
        
        for column in df.columns:
            series = df[column].dropna()
            
            # 95% confidence interval for mean
            mean = series.mean()
            sem = stats.sem(series)
            ci_95 = stats.t.interval(0.95, len(series)-1, loc=mean, scale=sem)
            
            # 99% confidence interval for mean
            ci_99 = stats.t.interval(0.99, len(series)-1, loc=mean, scale=sem)
            
            # Bootstrap confidence interval
            bootstrap_means = []
            for _ in range(1000):
                bootstrap_sample = np.random.choice(series, size=len(series), replace=True)
                bootstrap_means.append(np.mean(bootstrap_sample))
            
            bootstrap_ci_95 = np.percentile(bootstrap_means, [2.5, 97.5])
            
            results[column] = {
                "mean": float(mean),
                "standard_error": float(sem),
                "confidence_intervals": {
                    "95_percent": {
                        "lower": float(ci_95[0]),
                        "upper": float(ci_95[1])
                    },
                    "99_percent": {
                        "lower": float(ci_99[0]),
                        "upper": float(ci_99[1])
                    },
                    "bootstrap_95_percent": {
                        "lower": float(bootstrap_ci_95[0]),
                        "upper": float(bootstrap_ci_95[1])
                    }
                }
            }
        
        return results
    
    async def _regression_analysis(self, df: pd.DataFrame, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Perform regression analysis"""
        
        if df.shape[1] < 2:
            return {"message": "Need at least 2 variables for regression analysis"}
        
        results = {}
        
        # Simple linear regression for each pair of variables
        columns = df.columns.tolist()
        
        for i, target_col in enumerate(columns):
            for j, feature_col in enumerate(columns):
                if i != j:
                    # Prepare data
                    valid_data = df[[feature_col, target_col]].dropna()
                    if len(valid_data) < 10:  # Need minimum data points
                        continue
                    
                    X = valid_data[feature_col].values.reshape(-1, 1)
                    y = valid_data[target_col].values
                    
                    # Linear regression
                    slope, intercept, r_value, p_value, std_err = stats.linregress(X.flatten(), y)
                    
                    # Prediction intervals
                    y_pred = slope * X.flatten() + intercept
                    residuals = y - y_pred
                    mse = np.mean(residuals**2)
                    
                    results[f"{feature_col}_to_{target_col}"] = {
                        "slope": float(slope),
                        "intercept": float(intercept),
                        "r_squared": float(r_value**2),
                        "correlation_coefficient": float(r_value),
                        "p_value": float(p_value),
                        "standard_error": float(std_err),
                        "mse": float(mse),
                        "rmse": float(np.sqrt(mse)),
                        "significant": p_value < 0.05,
                        "equation": f"y = {slope:.4f}x + {intercept:.4f}"
                    }
        
        return results

class BehavioralAnalysisEngine:
    """Advanced behavioral pattern analysis"""
    
    def __init__(self, lab_system):
        self.lab = lab_system
        
    async def analyze(self, data: Dict[str, Any], parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Comprehensive behavioral analysis"""
        
        results = {
            "pattern_recognition": await self._pattern_recognition(data),
            "sequence_analysis": await self._sequence_analysis(data),
            "adaptation_analysis": await self._adaptation_analysis(data),
            "decision_analysis": await self._decision_analysis(data),
            "learning_curves": await self._learning_curves(data)
        }
        
        return results
    
    async def _pattern_recognition(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Identify behavioral patterns"""
        
        behaviors = data.get('behaviors', [])
        timestamps = pd.to_datetime(data.get('timestamps', []))
        
        if not behaviors:
            return {"message": "No behavioral data provided"}
        
        # Frequency analysis
        behavior_counts = pd.Series(behaviors).value_counts()
        
        # Temporal patterns
        if len(timestamps) == len(behaviors):
            df = pd.DataFrame({'behavior': behaviors, 'timestamp': timestamps})
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            
            hourly_patterns = df.groupby(['behavior', 'hour']).size().unstack(fill_value=0)
            daily_patterns = df.groupby(['behavior', 'day_of_week']).size().unstack(fill_value=0)
        else:
            hourly_patterns = None
            daily_patterns = None
        
        # Clustering of behavior sequences
        if len(behaviors) > 10:
            # Convert behaviors to numerical representation
            unique_behaviors = list(set(behaviors))
            behavior_to_num = {b: i for i, b in enumerate(unique_behaviors)}
            numeric_behaviors = [behavior_to_num[b] for b in behaviors]
            
            # Create feature vectors (sliding windows)
            window_size = min(5, len(numeric_behaviors) // 3)
            feature_vectors = []
            for i in range(len(numeric_behaviors) - window_size + 1):
                feature_vectors.append(numeric_behaviors[i:i+window_size])
            
            if len(feature_vectors) > 5:
                # K-means clustering
                kmeans = KMeans(n_clusters=min(3, len(feature_vectors)//2), random_state=42)
                clusters = kmeans.fit_predict(feature_vectors)
                
                cluster_info = {
                    "n_clusters": len(set(clusters)),
                    "cluster_sizes": {i: int(np.sum(clusters == i)) for i in set(clusters)}
                }
            else:
                cluster_info = {"message": "Insufficient data for clustering"}
        else:
            cluster_info = {"message": "Insufficient data for clustering"}
        
        return {
            "behavior_frequencies": behavior_counts.to_dict(),
            "most_common_behavior": behavior_counts.index[0] if len(behavior_counts) > 0 else None,
            "behavior_diversity": len(set(behaviors)),
            "temporal_patterns": {
                "hourly": hourly_patterns.to_dict() if hourly_patterns is not None else None,
                "daily": daily_patterns.to_dict() if daily_patterns is not None else None
            },
            "clustering": cluster_info
        }
    
    async def _sequence_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze behavioral sequences"""
        
        behaviors = data.get('behaviors', [])
        
        if len(behaviors) < 2:
            return {"message": "Need at least 2 behaviors for sequence analysis"}
        
        # Transition matrix
        unique_behaviors = list(set(behaviors))
        n_behaviors = len(unique_behaviors)
        transition_matrix = np.zeros((n_behaviors, n_behaviors))
        
        behavior_to_idx = {b: i for i, b in enumerate(unique_behaviors)}
        
        for i in range(len(behaviors) - 1):
            current_idx = behavior_to_idx[behaviors[i]]
            next_idx = behavior_to_idx[behaviors[i + 1]]
            transition_matrix[current_idx][next_idx] += 1
        
        # Normalize to probabilities
        row_sums = transition_matrix.sum(axis=1)
        transition_probs = transition_matrix / row_sums[:, np.newaxis]
        transition_probs = np.nan_to_num(transition_probs)  # Handle division by zero
        
        # Most likely transitions
        transitions = []
        for i, from_behavior in enumerate(unique_behaviors):
            for j, to_behavior in enumerate(unique_behaviors):
                if transition_probs[i][j] > 0:
                    transitions.append({
                        "from": from_behavior,
                        "to": to_behavior,
                        "probability": float(transition_probs[i][j]),
                        "count": int(transition_matrix[i][j])
                    })
        
        # Sort by probability
        transitions.sort(key=lambda x: x['probability'], reverse=True)
        
        # Sequence complexity (entropy)
        sequence_entropy = -np.sum(transition_probs * np.log2(transition_probs + 1e-10))
        
        return {
            "transition_matrix": transition_matrix.tolist(),
            "transition_probabilities": transition_probs.tolist(),
            "behavior_labels": unique_behaviors,
            "most_likely_transitions": transitions[:10],  # Top 10
            "sequence_entropy": float(sequence_entropy),
            "sequence_length": len(behaviors),
            "unique_transitions": len([t for t in transitions if t['count'] > 0])
        }
    
    async def _adaptation_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze adaptation and learning patterns"""
        
        performance_scores = data.get('performance_scores', [])
        timestamps = data.get('timestamps', [])
        
        if not performance_scores:
            return {"message": "No performance data provided"}
        
        performance_array = np.array(performance_scores)
        
        # Learning curve analysis
        if len(performance_scores) > 5:
            # Fit polynomial to see learning trend
            x = np.arange(len(performance_scores))
            
            # Linear trend
            linear_fit = np.polyfit(x, performance_array, 1)
            linear_slope = linear_fit[0]
            
            # Quadratic trend (for acceleration/deceleration)
            quad_fit = np.polyfit(x, performance_array, 2)
            
            # Moving average for smoothing
            window_size = min(5, len(performance_scores) // 3)
            if window_size > 1:
                moving_avg = pd.Series(performance_scores).rolling(window=window_size).mean().tolist()
            else:
                moving_avg = performance_scores
            
            # Detect plateaus and improvements
            changes = np.diff(performance_array)
            improvement_periods = []
            plateau_periods = []
            
            current_period = {"start": 0, "type": "improving" if changes[0] > 0 else "declining"}
            
            for i, change in enumerate(changes):
                if abs(change) < 0.01:  # Plateau threshold
                    if current_period["type"] != "plateau":
                        if i > current_period["start"]:
                            improvement_periods.append(current_period) if current_period["type"] == "improving" else None
                        current_period = {"start": i, "type": "plateau"}
                elif change > 0.01:  # Improvement
                    if current_period["type"] != "improving":
                        if current_period["type"] == "plateau":
                            plateau_periods.append({**current_period, "end": i})
                        current_period = {"start": i, "type": "improving"}
            
            # Close final period
            final_period = {**current_period, "end": len(changes)}
            if current_period["type"] == "improving":
                improvement_periods.append(final_period)
            elif current_period["type"] == "plateau":
                plateau_periods.append(final_period)
        
        else:
            linear_slope = 0
            quad_fit = [0, 0, 0]
            moving_avg = performance_scores
            improvement_periods = []
            plateau_periods = []
        
        return {
            "learning_trend": {
                "linear_slope": float(linear_slope),
                "quadratic_coefficients": [float(c) for c in quad_fit],
                "overall_improvement": float(performance_array[-1] - performance_array[0]) if len(performance_array) > 1 else 0
            },
            "performance_metrics": {
                "initial_performance": float(performance_array[0]),
                "final_performance": float(performance_array[-1]),
                "best_performance": float(np.max(performance_array)),
                "worst_performance": float(np.min(performance_array)),
                "average_performance": float(np.mean(performance_array)),
                "performance_variance": float(np.var(performance_array))
            },
            "learning_phases": {
                "improvement_periods": improvement_periods,
                "plateau_periods": plateau_periods,
                "total_improvement_time": sum([p.get("end", 0) - p["start"] for p in improvement_periods])
            },
            "smoothed_performance": moving_avg
        }
    
    async def _decision_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze decision-making patterns"""
        
        decisions = data.get('decisions', [])
        outcomes = data.get('outcomes', [])
        contexts = data.get('contexts', [])
        
        if not decisions:
            return {"message": "No decision data provided"}
        
        # Decision frequency
        decision_counts = pd.Series(decisions).value_counts()
        
        # Decision outcomes analysis
        if outcomes and len(outcomes) == len(decisions):
            decision_outcome_df = pd.DataFrame({'decision': decisions, 'outcome': outcomes})
            success_rates = decision_outcome_df.groupby('decision')['outcome'].agg(['mean', 'count']).to_dict()
        else:
            success_rates = None
        
        # Context-dependent decision analysis
        if contexts and len(contexts) == len(decisions):
            context_decision_df = pd.DataFrame({'context': contexts, 'decision': decisions})
            context_patterns = context_decision_df.groupby('context')['decision'].apply(
                lambda x: x.value_counts().to_dict()
            ).to_dict()
        else:
            context_patterns = None
        
        return {
            "decision_frequencies": decision_counts.to_dict(),
            "most_common_decision": decision_counts.index[0] if len(decision_counts) > 0 else None,
            "decision_diversity": len(set(decisions)),
            "success_rates": success_rates,
            "context_patterns": context_patterns,
            "total_decisions": len(decisions)
        }
    
    async def _learning_curves(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate learning curve analysis"""
        
        performance_scores = data.get('performance_scores', [])
        
        if len(performance_scores) < 5:
            return {"message": "Need at least 5 performance scores for learning curve analysis"}
        
        scores = np.array(performance_scores)
        
        # Fit different learning models
        x = np.arange(len(scores))
        
        # Exponential learning model: y = a * (1 - exp(-b*x)) + c
        from scipy.optimize import curve_fit
        
        def exponential_learning(x, a, b, c):
            return a * (1 - np.exp(-b * x)) + c
        
        try:
            exp_params, _ = curve_fit(exponential_learning, x, scores, 
                                    bounds=([0, 0, -np.inf], [np.inf, np.inf, np.inf]))
            exp_fit_quality = np.corrcoef(scores, exponential_learning(x, *exp_params))[0, 1]**2
        except:
            exp_params = [0, 0, 0]
            exp_fit_quality = 0
        
        # Power law learning: y = a * x^b + c
        def power_learning(x, a, b, c):
            return a * np.power(x + 1, b) + c
        
        try:
            power_params, _ = curve_fit(power_learning, x, scores)
            power_fit_quality = np.corrcoef(scores, power_learning(x, *power_params))[0, 1]**2
        except:
            power_params = [0, 0, 0]
            power_fit_quality = 0
        
        # Best fit model
        if exp_fit_quality > power_fit_quality:
            best_model = "exponential"
            best_params = exp_params.tolist()
            best_quality = exp_fit_quality
        else:
            best_model = "power_law"
            best_params = power_params.tolist()
            best_quality = power_fit_quality
        
        return {
            "exponential_model": {
                "parameters": exp_params.tolist(),
                "r_squared": float(exp_fit_quality)
            },
            "power_law_model": {
                "parameters": power_params.tolist(),
                "r_squared": float(power_fit_quality)
            },
            "best_fit_model": {
                "type": best_model,
                "parameters": best_params,
                "r_squared": float(best_quality)
            },
            "learning_rate": float(np.mean(np.diff(scores))) if len(scores) > 1 else 0,
            "performance_range": {
                "initial": float(scores[0]),
                "final": float(scores[-1]),
                "improvement": float(scores[-1] - scores[0])
            }
        }

# Integration and testing
if __name__ == "__main__":
    # Test the analysis engines
    print("Research Data Analysis Engine - Ready for sophisticated analysis operations")
