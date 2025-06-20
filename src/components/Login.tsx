import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { Appconfig } from '../config'

export default function Login() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // TODO: 실제 로그인 로직 구현
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            })
            console.log(data)
            if (error) {
                setError(error.message)
            } else {
                
                localStorage.setItem('isLoggedIn', 'true')
                localStorage.setItem('username', data.user?.email || '')
                navigate(Appconfig.admin_panel_url)
            }
            // 임시로 간단한 검증
            if (formData.email === 'admin' && formData.password === 'admin') {
                // 로그인 성공
                localStorage.setItem('isLoggedIn', 'true')
                localStorage.setItem('username', formData.email)
                navigate(Appconfig.admin_panel_url)
            } else {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.')
            }
            
        } catch (err) {
            console.error('Login failed:', err)
            setError('로그인에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }

    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* 야구공 이미지 */}
                    <div className="flex justify-center mb-6">
                        <div className="w-85 h-85  flex items-center justify-center overflow-hidden">
                            <img 
                                src="/mainlogo.png" 
                                alt="베이스볼 스코어보드 로고" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 아이디 입력 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="이메일 입력하세요"
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

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    {/* 개발용 안내 */}
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                            개발용 계정: admin / admin
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 