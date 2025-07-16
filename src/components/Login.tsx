import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { Appconfig } from '../config'

export default function Login() {
    const navigate = useNavigate()
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [showResetPwModal, setShowResetPwModal] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            })

            if (error) {
                setError(error.message)
            } else {
                localStorage.setItem('isLoggedIn', 'true')
                localStorage.setItem('username', data.user?.email || '')
                navigate(Appconfig.admin_panel_url)
            }
        } catch (err) {
            console.error('Login failed:', err)
            setError('로그인에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            if (formData.password !== formData.confirmPassword) {
                setError('비밀번호가 일치하지 않습니다.')
                return
            }

            if (formData.password.length < 6) {
                setError('비밀번호는 최소 6자 이상이어야 합니다.')
                return
            }

            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
                setFormData({ email: '', password: '', confirmPassword: '' })
                setTimeout(() => {
                    setShowRegisterModal(false)
                    setSuccess('')
                }, 2000)
            }
        } catch (err) {
            console.error('Register failed:', err)
            setError('회원가입에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }
    const handleResetPw = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${Appconfig.admin_panel_url}/reset-password`
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess('이메일을 확인해주세요.')
                setFormData({ email: '', password: '', confirmPassword: '' })
                setTimeout(() => {
                    setShowResetPwModal(false)
                    setSuccess('')
                }, 2000)
            }
        } catch (err) {
            console.error('Reset password failed:', err)
            setError('이메일 전송에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const openRegisterModal = () => {
        setShowRegisterModal(true)
        setFormData({ email: '', password: '', confirmPassword: '' })
        setError('')
        setSuccess('')
    }

    const openResetPwModal = () => {
        setShowResetPwModal(true)
        setFormData({ email: '', password: '', confirmPassword: '' })
        setError('')
        setSuccess('')
    }

    const closeResetPwModal = () => {
        setShowResetPwModal(false)
        setFormData({ email: '', password: '', confirmPassword: '' })
        setError('')
        setSuccess('')
    }
    
    const closeRegisterModal = () => {
        setShowRegisterModal(false)
        setFormData({ email: '', password: '', confirmPassword: '' })
        setError('')
        setSuccess('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* 야구공 이미지 */}
                    <div className="flex justify-center mb-6">
                        <div className="w-85 h-50 flex items-center justify-center overflow-hidden">
                            <img 
                                src="/mainlogo.png" 
                                alt="베이스볼 스코어보드 로고" 
                                className="w-full h-full object-cover scale-80"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* 이메일 입력 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>

                        {/* 비밀번호 입력 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="비밀번호를 입력하세요"
                            />
                        </div>
                        <div className="flex items-center">
                            <input id="remember" type="checkbox" />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Remember me</label>
                        </div>

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    {/* 사용자 등록 버튼 */}
                    <div className="mt-6 text-center flex justify-between">
                        <button
                            type="button"
                            onClick={openRegisterModal}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            사용자 등록
                        </button>
                        <button
                            type="button"
                            onClick={openResetPwModal}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            패스워드 재설정
                        </button>
                    </div>
                </div>
            </div>

            {/* 회원가입 모달 */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">사용자 등록</h2>
                            <button
                                onClick={closeRegisterModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 text-center">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-6">
                            {/* 이메일 입력 */}
                            <div>
                                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    id="modal-email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="이메일을 입력하세요"
                                />
                            </div>

                            {/* 비밀번호 입력 */}
                            <div>
                                <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    id="modal-password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="비밀번호를 입력하세요 (최소 6자)"
                                />
                            </div>

                            {/* 비밀번호 확인 */}
                            <div>
                                <label htmlFor="modal-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 확인
                                </label>
                                <input
                                    type="password"
                                    id="modal-confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="비밀번호를 다시 입력하세요"
                                />
                            </div>

                            {/* 회원가입 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? '회원가입 중...' : '회원가입'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 패스워드 설정 모달 */}
            {showResetPwModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">패스워드 재설정</h2>
                            <button
                                onClick={closeResetPwModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleResetPw} className="space-y-6">
                            {/* 이메일 입력 */}
                            <div>
                                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    패스워드 재설정 email을 발송합니다.
                                </label>
                                <input
                                    type="email"
                                    id="modal-email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="이메일을 입력하세요"
                                />
                            </div>

                            {/* 패스워드 찾기 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? '이메일 전송 중...' : '패스워드 재설정'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 카피라이트 */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="text-white text-xs text-center opacity-70 px-4">
                    © 2025 Sco-B System. All rights reserved.
                </div>
            </div>
        </div>
    )
} 