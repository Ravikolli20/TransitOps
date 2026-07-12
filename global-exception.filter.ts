import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.sub);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
