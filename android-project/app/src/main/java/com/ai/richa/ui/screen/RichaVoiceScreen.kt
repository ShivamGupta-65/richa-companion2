package com.ai.richa.ui.screen

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.sin

@Composable
fun RichaVoiceScreen(
    currentStatus: String = "Listening...", // "Listening", "Speaking", "Thinking", or "Idle"
    userName: String = "Shivam",
    onBackPressed: () -> Unit = {}
) {
    // Elegant pure black and bottom-glowing theme setup
    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF000000), // Pure Black Main Dark Body
            Color(0xFF050B1B), // Soft deep cosmic navy
            Color(0xFF0F1E44), // Vibrant Indigo Bottom Glow Base
        )
    )

    // Breathing Animation values
    val infiniteTransition = rememberInfiniteTransition(label = "breathe")
    val breatheScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "scaling"
    )

    val innerBreatheAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "alpha"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        // Floating Top Header Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "RICHA AI",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .clickable { onBackPressed() }
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text("Chat Mode", color = Color(0xFF6AA7FF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Center Content - Fluid Breathing Companion Avatar and waveforms
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            
            // Halo breathing circle rings around avatar
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(260.dp)
                    .graphicsLayer {
                        scaleX = breatheScale
                        scaleY = breatheScale
                    }
            ) {
                // Glow Ring 1
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color(0xFF3B82F6).copy(alpha = 0.15f), Color.Transparent),
                            radius = size.minDimension / 1.5f
                        )
                    )
                }

                // Breathing stroke outline Ring 2
                Canvas(modifier = Modifier.size(210.dp)) {
                    drawCircle(
                        color = Color(0xFF4F46E5).copy(alpha = innerBreatheAlpha * 0.4f),
                        style = Stroke(width = 2.dp)
                    )
                }

                // Central Fluid Core Avatar representing Richa
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    Color(0xFF2563EB), // Sleek Royal Blue
                                    Color(0xFF4F46E5), // Indigo Glow Core
                                    Color(0xFFEC4899)  // Playful Ruby Pink Accent
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "R",
                        color = Color.White,
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Light,
                        letterSpacing = (-2).sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))

            // Subtitle state feedback
            Text(
                text = "What's next, $userName?",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = currentStatus.uppercase(),
                color = when (currentStatus) {
                    "Listening..." -> Color(0xFF10B981) // High-visibility Emerald
                    "Speaking..." -> Color(0xFF6366F1) // Electric Violet
                    "Thinking..." -> Color(0xFFF59E0B) // Amber Golden glow
                    else -> Color.White.copy(alpha = 0.5f)
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Waveform Amplitude visualizer widget
            VoiceEqualizerWaveform(
                isActive = (currentStatus == "Listening..." || currentStatus == "Speaking..."),
                amplitudeFactor = if (currentStatus == "Speaking...") 2.8f else 1.2f
            )
        }

        // Bottom control pills
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 40.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .padding(horizontal = 24.dp, vertical = 14.dp)
            ) {
                Text(
                    text = if(currentStatus == "Listening...") "Speak anytime, I'm listening" else "Tap wave to pause",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
fun VoiceEqualizerWaveform(isActive: Boolean, amplitudeFactor: Float) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveform")
    val waveOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ), label = "phaseShift"
    )

    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .padding(horizontal = 40.dp)
    ) {
        val width = size.width
        val height = size.height
        val centerY = height / 2f
        val pointsCount = 40
        val step = width / pointsCount

        val brush = Brush.linearGradient(
            colors = listOf(Color(0xFF3B82F6), Color(0xFF6366F1), Color(0xFFEC4899))
        )

        for (i in 0 until pointsCount) {
            val x = i * step
            // Modulate scale amplitude based on proximity to center for organic look
            val normalizedX = i.toFloat() / pointsCount
            val centerConstraint = sin(normalizedX * Math.PI).toFloat()
            
            val amplitude = if (isActive) {
                (sin((normalizedX * 4f * Math.PI) + waveOffset).toFloat() * 18.dp.toPx() * centerConstraint * amplitudeFactor)
            } else {
                sin(normalizedX * Math.PI).toFloat() * 2.dp.toPx()
            }

            drawLine(
                brush = brush,
                start = androidx.compose.ui.geometry.Offset(x, centerY - amplitude),
                end = androidx.compose.ui.geometry.Offset(x, centerY + amplitude),
                strokeWidth = 3.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
        }
    }
}
