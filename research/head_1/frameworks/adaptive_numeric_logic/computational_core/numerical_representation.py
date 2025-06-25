import decimal
from decimal import Decimal, getcontext, DivisionByZero, InvalidOperation
from typing import Union, Optional
import warnings

# Try to import gmpy2, fallback to decimal if not available
try:
    import gmpy2
    from gmpy2 import mpfr, mpz
    USING_GMPY2 = True
except ImportError:
    USING_GMPY2 = False
    warnings.warn("gmpy2 not available, falling back to decimal module for arbitrary precision")

class ArbitraryPrecisionFloat:
    """Enhanced arbitrary precision float implementation with gmpy2/decimal fallback"""
    
    def __init__(self, value: Union[str, int, float], precision: int = 256):
        self._precision = precision
        
        if USING_GMPY2:
            gmpy2.get_context().precision = precision
            try:
                if isinstance(value, (int, mpz)):
                    self.value = mpfr(str(value))
                elif isinstance(value, (float, mpfr)):
                    self.value = mpfr(str(value))
                else:
                    self.value = mpfr(str(value))
            except (ValueError, TypeError) as e:
                raise ValueError(f"Invalid value for conversion: {value}") from e
        else:
            getcontext().prec = precision // 3  # Convert bits to decimal digits
            try:
                self.value = Decimal(str(value))
            except decimal.InvalidOperation as e:
                raise ValueError(f"Invalid value for conversion: {value}") from e

    def __convert_operand(self, other) -> 'ArbitraryPrecisionFloat':
        """Safely convert operand to ArbitraryPrecisionFloat"""
        if USING_GMPY2 and isinstance(other, (mpfr, mpz)):
            return ArbitraryPrecisionFloat(str(other), self._precision)
        elif isinstance(other, (int, float, str)):
            return ArbitraryPrecisionFloat(str(other), self._precision)
        elif isinstance(other, ArbitraryPrecisionFloat):
            return other
        raise TypeError(f"Unsupported operand type: {type(other)}")

    def _apply_operation(self, other, op) -> 'ArbitraryPrecisionFloat':
        """Apply arithmetic operation with proper context"""
        other = self.__convert_operand(other)
        precision = max(self._precision, other._precision)
        
        try:
            if USING_GMPY2:
                with gmpy2.context() as ctx:
                    ctx.precision = precision
                    result = op(self.value, other.value)
            else:
                with decimal.localcontext(decimal.Context(prec=precision // 3)):
                    result = op(self.value, other.value)
            return ArbitraryPrecisionFloat(str(result), precision)
        except (ZeroDivisionError, decimal.InvalidOperation) as e:
            raise ValueError(f"Arithmetic error: {str(e)}")

    # Arithmetic operations
    def __add__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: x + y)

    def __radd__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: y + x)

    def __sub__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: x - y)

    def __rsub__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: y - x)

    def __mul__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: x * y)

    def __rmul__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: y * x)

    def __truediv__(self, other) -> 'ArbitraryPrecisionFloat':
        other = self.__convert_operand(other)
        if other.value == 0:
            raise ValueError("Division by zero")
        return self._apply_operation(other, lambda x, y: x / y)

    def __rtruediv__(self, other) -> 'ArbitraryPrecisionFloat':
        if self.value == 0:
            raise ValueError("Division by zero")
        return self._apply_operation(other, lambda x, y: y / x)

    def __mod__(self, other) -> 'ArbitraryPrecisionFloat':
        return self._apply_operation(other, lambda x, y: x % y)

    def __divmod__(self, other) -> tuple['ArbitraryPrecisionFloat', 'ArbitraryPrecisionFloat']:
        other = self.__convert_operand(other)
        if other.value == 0:
            raise ValueError("Division by zero")
        if USING_GMPY2:
            with gmpy2.context() as ctx:
                ctx.precision = self._precision
                q, r = divmod(self.value, other.value)
        else:
            with decimal.localcontext(decimal.Context(prec=self._precision // 3)):
                q, r = divmod(self.value, other.value)
        return (ArbitraryPrecisionFloat(str(q), self._precision),
                ArbitraryPrecisionFloat(str(r), self._precision))

    # Comparison operations
    def __lt__(self, other) -> bool:
        other = self.__convert_operand(other)
        return self.value < other.value

    def __le__(self, other) -> bool:
        other = self.__convert_operand(other)
        return self.value <= other.value

    def __eq__(self, other) -> bool:
        try:
            other = self.__convert_operand(other)
            return self.value == other.value
        except TypeError:
            return False

    def __gt__(self, other) -> bool:
        other = self.__convert_operand(other)
        return self.value > other.value

    def __ge__(self, other) -> bool:
        other = self.__convert_operand(other)
        return self.value >= other.value

    # Conversion and representation
    def __float__(self) -> float:
        return float(self.value)

    def __str__(self) -> str:
        return str(self.value)

    def __repr__(self) -> str:
        return f"ArbitraryPrecisionFloat('{str(self.value)}', precision={self._precision})"

    def __abs__(self) -> 'ArbitraryPrecisionFloat':
        return ArbitraryPrecisionFloat(str(abs(self.value)), self._precision)

    def __bool__(self) -> bool:
        return bool(self.value)

    def __neg__(self) -> 'ArbitraryPrecisionFloat':
        return ArbitraryPrecisionFloat(str(-self.value), self._precision)

    def __pos__(self) -> 'ArbitraryPrecisionFloat':
        return ArbitraryPrecisionFloat(str(+self.value), self._precision)

    # Precision management
    def set_precision(self, precision: int) -> None:
        """Set new precision and adjust value accordingly"""
        if USING_GMPY2:
            with gmpy2.context() as ctx:
                ctx.precision = precision
                self.value = mpfr(str(self.value))
        else:
            getcontext().prec = precision // 3
            self.value = Decimal(str(self.value))
        self._precision = precision

    def get_precision(self) -> int:
        """Get current precision"""
        return self._precision

    def normalize(self) -> 'ArbitraryPrecisionFloat':
        """Return normalized value"""
        return ArbitraryPrecisionFloat(str(self.value), self._precision)
